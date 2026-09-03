import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['LECTURER', 'STUDENT'], {
    errorMap: () => ({ message: 'Role must be either LECTURER or STUDENT' }),
  }),
  department: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'),
  isRecurring: z.boolean().optional().default(false),
  recurringWeeks: z.number().int().min(1).max(12).optional().default(4),
});

export const bookSlotSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required'),
  subject: z.string().trim().max(255, 'Subject cannot exceed 255 characters').optional(),
});

export const parseVoiceSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
});

export const parseAudioSchema = z.object({
  audioBase64: z.string().min(1, 'Audio data is required'),
  mimeType: z.string().optional().default('audio/webm'),
});

export const parsedSlotSchema = z.object({
  transcript: z.string().optional(),
  slots: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'),
      endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'),
      isRecurring: z.boolean().default(false),
    })
  )
});
