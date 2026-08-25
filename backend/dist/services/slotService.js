"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotService = exports.SlotStatus = void 0;
const client_1 = require("@prisma/client");
const emailService_js_1 = require("./emailService.js");
const prisma = new client_1.PrismaClient();
exports.SlotStatus = {
    OPEN: 'OPEN',
    PENDING: 'PENDING',
    BOOKED: 'BOOKED',
    CANCELLED: 'CANCELLED',
};
exports.slotService = {
    /**
     * Creates a single availability slot for a lecturer.
     */
    async createSlot(input) {
        const { lecturerId, date, startTime, endTime, isRecurring = false } = input;
        // Check for overlapping slots for the same lecturer on the same date
        const existing = await prisma.availabilitySlot.findFirst({
            where: {
                lecturerId,
                date,
                status: { in: [exports.SlotStatus.OPEN, exports.SlotStatus.PENDING, exports.SlotStatus.BOOKED] },
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
                status: exports.SlotStatus.OPEN,
            },
        });
    },
    /**
     * Creates recurring concrete slot rows for N weeks.
     */
    async createRecurringSlots(input) {
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
            }
            catch (err) {
                console.warn(`Skipped recurring slot creation for date ${formattedDate}: ${err.message}`);
            }
        }
        return createdSlots;
    },
    /**
     * Fetches availability slots for a specific lecturer.
     */
    async getLecturerSlots(lecturerId, status) {
        const todayStr = new Date().toISOString().split('T')[0];
        await prisma.availabilitySlot.deleteMany({
            where: {
                date: { lt: todayStr },
            },
        });
        return await prisma.availabilitySlot.findMany({
            where: {
                lecturerId,
                date: { gte: todayStr },
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
    async cancelSlot(slotId, lecturerId) {
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
                data: { status: exports.SlotStatus.CANCELLED },
            });
            if (slot.booking) {
                // Pending bookings get REJECTED when the slot is force-cancelled
                const newBookingStatus = slot.booking.status === 'PENDING' ? 'REJECTED' : 'CANCELLED';
                await tx.booking.update({
                    where: { id: slot.booking.id },
                    data: { status: newBookingStatus },
                });
            }
        });
        if (slot.booking && slot.booking.student) {
            emailService_js_1.emailService
                .sendBookingCancellation({
                studentName: slot.booking.student.name,
                studentEmail: slot.booking.student.email,
                lecturerName: slot.lecturer.name,
                lecturerEmail: slot.lecturer.email,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
            }, 'LECTURER')
                .catch(console.error);
        }
        return { message: 'Slot cancelled successfully' };
    },
};
