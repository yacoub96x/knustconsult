"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookSlotSchema = exports.createSlotSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    role: zod_1.z.enum(['LECTURER', 'STUDENT'], {
        errorMap: () => ({ message: 'Role must be either LECTURER or STUDENT' }),
    }),
    department: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.createSlotSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'),
    endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'),
    isRecurring: zod_1.z.boolean().optional().default(false),
    recurringWeeks: zod_1.z.number().int().min(1).max(12).optional().default(4),
});
exports.bookSlotSchema = zod_1.z.object({
    slotId: zod_1.z.string().min(1, 'Slot ID is required'),
    subject: zod_1.z.string().trim().max(255, 'Subject cannot exceed 255 characters').optional(),
});
