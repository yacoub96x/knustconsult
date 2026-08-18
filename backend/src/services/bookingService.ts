import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService.js';

const prisma = new PrismaClient();

export const SlotStatus = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const;

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export const bookingService = {
  /**
   * Atomically creates a PENDING booking request for a student.
   * Sets the slot to PENDING so no other student can request it simultaneously.
   * Uses a transaction + unique DB constraint to guarantee race-safety.
   */
  async bookSlot(slotId: string, studentId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
        include: { lecturer: true },
      });

      if (!slot) {
        throw { statusCode: 404, message: 'Availability slot not found' };
      }

      if (slot.status !== SlotStatus.OPEN) {
        throw { statusCode: 409, message: 'This slot is no longer available or has already been requested' };
      }

      const existingBooking = await tx.booking.findUnique({
        where: { slotId },
      });

      if (existingBooking) {
        throw { statusCode: 409, message: 'This slot has already been requested' };
      }

      // Lock the slot so no one else can request it
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { status: SlotStatus.PENDING },
      });

      const booking = await tx.booking.create({
        data: {
          slotId,
          studentId,
          status: BookingStatus.PENDING,
        },
        include: {
          slot: {
            include: { lecturer: true },
          },
          student: true,
        },
      });

      return booking;
    });

    // Email the lecturer: new appointment request awaiting action
    emailService
      .sendBookingRequest({
        studentName: result.student.name,
        studentEmail: result.student.email,
        lecturerName: result.slot.lecturer.name,
        lecturerEmail: result.slot.lecturer.email,
        date: result.slot.date,
        startTime: result.slot.startTime,
        endTime: result.slot.endTime,
      })
      .catch(console.error);

    return result;
  },

  /**
   * Lecturer approves a pending booking → CONFIRMED, slot → BOOKED.
   */
  async approveBooking(bookingId: string, lecturerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        slot: {
          include: { lecturer: true },
        },
      },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Booking not found' };
    }

    if (booking.slot.lecturerId !== lecturerId) {
      throw { statusCode: 403, message: 'Unauthorized: This is not your slot' };
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw { statusCode: 400, message: 'Only pending bookings can be approved' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.BOOKED },
      });
    });

    // Email the student: their request was confirmed
    emailService
      .sendBookingApproved({
        studentName: booking.student.name,
        studentEmail: booking.student.email,
        lecturerName: booking.slot.lecturer.name,
        lecturerEmail: booking.slot.lecturer.email,
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
      })
      .catch(console.error);

    return { message: 'Booking approved successfully' };
  },

  /**
   * Lecturer rejects a pending booking → REJECTED, slot → OPEN (bookable again).
   */
  async rejectBooking(bookingId: string, lecturerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        slot: {
          include: { lecturer: true },
        },
      },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Booking not found' };
    }

    if (booking.slot.lecturerId !== lecturerId) {
      throw { statusCode: 403, message: 'Unauthorized: This is not your slot' };
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw { statusCode: 400, message: 'Only pending bookings can be rejected' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.REJECTED },
      });

      // Reopen the slot so another student can request it
      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.OPEN },
      });
    });

    // Email the student: their request was declined
    emailService
      .sendBookingRejected({
        studentName: booking.student.name,
        studentEmail: booking.student.email,
        lecturerName: booking.slot.lecturer.name,
        lecturerEmail: booking.slot.lecturer.email,
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
      })
      .catch(console.error);

    return { message: 'Booking rejected and slot reopened' };
  },

  /**
   * Fetches all bookings belonging to a specific student.
   */
  async getStudentBookings(studentId: string) {
    return await prisma.booking.findMany({
      where: { studentId },
      include: {
        slot: {
          include: {
            lecturer: {
              select: { id: true, name: true, email: true, department: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Cancels a student's CONFIRMED booking and reopens the slot.
   * Only applies to CONFIRMED bookings — pending requests go through reject flow.
   */
  async cancelBooking(bookingId: string, studentId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        slot: {
          include: { lecturer: true },
        },
      },
    });

    if (!booking) {
      throw { statusCode: 404, message: 'Booking not found' };
    }

    if (booking.studentId !== studentId) {
      throw { statusCode: 403, message: 'Unauthorized: You do not own this booking' };
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw { statusCode: 400, message: 'Only confirmed bookings can be cancelled' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.OPEN },
      });
    });

    emailService
      .sendBookingCancellation(
        {
          studentName: booking.student.name,
          studentEmail: booking.student.email,
          lecturerName: booking.slot.lecturer.name,
          lecturerEmail: booking.slot.lecturer.email,
          date: booking.slot.date,
          startTime: booking.slot.startTime,
          endTime: booking.slot.endTime,
        },
        'STUDENT'
      )
      .catch(console.error);

    return { message: 'Booking cancelled successfully and slot reopened' };
  },
};
