import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService.js';

const prisma = new PrismaClient();

export const SlotStatus = {
  OPEN: 'OPEN',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const;

export type SlotStatusType = typeof SlotStatus[keyof typeof SlotStatus];

export interface CreateSlotInput {
  lecturerId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isRecurring?: boolean;
  recurringWeeks?: number; // Number of consecutive weeks to repeat if isRecurring is true
}

export const slotService = {
  /**
   * Creates a single availability slot for a lecturer.
   */
  async createSlot(input: CreateSlotInput) {
    const { lecturerId, date, startTime, endTime, isRecurring = false } = input;

    // Check for overlapping slots for the same lecturer on the same date
    const existing = await prisma.availabilitySlot.findFirst({
      where: {
        lecturerId,
        date,
        status: { in: [SlotStatus.OPEN, SlotStatus.BOOKED] },
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (existing) {
      throw new Error(`An active slot already exists for ${date} between ${existing.startTime} and ${existing.endTime}`);
    }

    return await prisma.availabilitySlot.create({
      data: {
        lecturerId,
        date,
        startTime,
        endTime,
        isRecurring,
        status: SlotStatus.OPEN,
      },
    });
  },

  /**
   * Creates recurring concrete slot rows for N weeks.
   */
  async createRecurringSlots(input: CreateSlotInput) {
    const weeks = input.recurringWeeks || 4; // Default to 4 weeks if unspecified
    const startDate = new Date(input.date);
    const createdSlots = [];

    for (let i = 0; i < weeks; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i * 7);
      const formattedDate = current.toISOString().split('T')[0];

      try {
        const slot = await this.createSlot({
          ...input,
          date: formattedDate,
          isRecurring: true,
        });
        createdSlots.push(slot);
      } catch (err: any) {
        console.warn(`Skipped recurring slot creation for date ${formattedDate}: ${err.message}`);
      }
    }

    return createdSlots;
  },

  /**
   * Fetches availability slots for a specific lecturer.
   */
  async getLecturerSlots(lecturerId: string, status?: SlotStatusType) {
    return await prisma.availabilitySlot.findMany({
      where: {
        lecturerId,
        ...(status ? { status } : {}),
      },
      include: {
        booking: {
          include: {
            student: {
              select: { id: true, name: true, email: true, department: true },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },

  /**
   * Cancels a slot. If the slot was booked, cancels the booking as well and sends cancellation emails.
   */
  async cancelSlot(slotId: string, lecturerId: string) {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: {
        lecturer: true,
        booking: {
          include: { student: true },
        },
      },
    });

    if (!slot) {
      throw new Error('Slot not found');
    }

    if (slot.lecturerId !== lecturerId) {
      throw new Error('Unauthorized: You do not own this slot');
    }

    await prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { status: SlotStatus.CANCELLED },
      });

      if (slot.booking) {
        await tx.booking.update({
          where: { id: slot.booking.id },
          data: { status: 'CANCELLED' },
        });
      }
    });

    if (slot.booking && slot.booking.student) {
      emailService
        .sendBookingCancellation(
          {
            studentName: slot.booking.student.name,
            studentEmail: slot.booking.student.email,
            lecturerName: slot.lecturer.name,
            lecturerEmail: slot.lecturer.email,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
          'LECTURER'
        )
        .catch(console.error);
    }

    return { message: 'Slot cancelled successfully' };
  },
};
