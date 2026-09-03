import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { createSlotSchema, parseVoiceSchema } from '../utils/validation.js';
import { slotService } from '../services/slotService.js';
import { voiceService } from '../services/voiceService.js';

const router = Router();

// POST /api/slots/parse-voice (Lecturer only)
router.post('/parse-voice', requireAuth, requireRole('LECTURER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = parseVoiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }

    const { transcript } = parseResult.data;
    const currentDate = new Date().toISOString().split('T')[0];
    
    const result = await voiceService.parseVoiceTranscript(transcript, currentDate);
    return res.json({ transcript: result.transcript, slots: result.slots });
  } catch (err: any) {
    console.error('Error parsing voice:', err);
    return res.status(400).json({ error: err.message || 'Could not parse availability from that. Try rephrasing or enter manually.' });
  }
});

// POST /api/slots (Lecturer only)
router.post('/', requireAuth, requireRole('LECTURER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createSlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return res.status(400).json({ error: issue.message, field: issue.path[0]?.toString() });
    }

    const { date, startTime, endTime, isRecurring, recurringWeeks } = parseResult.data;
    const lecturerId = req.user!.id;

    if (isRecurring) {
      const slots = await slotService.createRecurringSlots({
        lecturerId,
        date,
        startTime,
        endTime,
        isRecurring: true,
        recurringWeeks,
      });

      return res.status(201).json({
        message: `Successfully created ${slots.length} recurring slots`,
        slots,
      });
    } else {
      const slot = await slotService.createSlot({
        lecturerId,
        date,
        startTime,
        endTime,
        isRecurring: false,
      });

      return res.status(201).json({
        message: 'Availability slot created successfully',
        slot,
      });
    }
  } catch (err: any) {
    console.error('Error creating slot:', err);
    return res.status(400).json({ error: err.message || 'Failed to create availability slot' });
  }
});

// GET /api/slots/mine (Lecturer only)
router.get('/mine', requireAuth, requireRole('LECTURER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lecturerId = req.user!.id;
    const slots = await slotService.getLecturerSlots(lecturerId);
    return res.json({ slots });
  } catch (err) {
    console.error('Error fetching lecturer slots:', err);
    return res.status(500).json({ error: 'Failed to retrieve your slots' });
  }
});

// DELETE /api/slots/:id (Lecturer only)
router.delete('/:id', requireAuth, requireRole('LECTURER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const slotId = req.params.id as string;
    const lecturerId = req.user!.id;

    const result = await slotService.cancelSlot(slotId, lecturerId);
    return res.json(result);
  } catch (err: any) {
    console.error('Error cancelling slot:', err);
    const status = err.message?.includes('Unauthorized') ? 403 : 400;
    return res.status(status).json({ error: err.message || 'Failed to cancel slot' });
  }
});

export default router;
