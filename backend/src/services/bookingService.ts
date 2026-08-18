import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService.js';

const prisma = new PrismaClient();

export const SlotStatus = {
  OPEN: 'OPEN',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const;

export const BookingStatus = {
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;

export const bookingService = {
  /**
   * Atomically books an availability slot for a student using Prisma $transaction.
   * Guarantees double-booking prevention at both DB unique constraint level & transaction check.
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
        throw { statusCode: 409, message: 'This slot is no longer available or has already been booked' };
      }

      const existingBooking = await tx.booking.findUnique({
        where: { slotId },
      });

      if (existingBooking) {
        throw { statusCode: 409, message: 'This slot has already been booked' };
      }

      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { status: SlotStatus.BOOKED },
      });

      const booking = await tx.booking.create({
        data: {
          slotId,
          studentId,
          status: BookingStatus.CONFIRMED,
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

    emailService
      .sendBookingConfirmation({
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
   * Cancels a student's booking and reopens the availability slot.
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
