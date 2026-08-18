import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import { bookSlotSchema } from '../utils/validation.js';
import { bookingService } from '../services/bookingService.js';

const router = Router();

// POST /api/bookings (Student only)
router.post('/', requireAuth, requireRole('STUDENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = bookSlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return res.status(400).json({ error: issue.message, field: issue.path[0]?.toString() });
    }

    const { slotId } = parseResult.data;
    const studentId = req.user!.id;

    const booking = await bookingService.bookSlot(slotId, studentId);

    return res.status(201).json({
      message: 'Consultation slot booked successfully',
      booking,
    });
  } catch (err: any) {
    console.error('Error booking slot:', err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: err.message || 'Failed to book slot' });
  }
});

// GET /api/bookings/mine (Student only)
router.get('/mine', requireAuth, requireRole('STUDENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const bookings = await bookingService.getStudentBookings(studentId);
    return res.json({ bookings });
  } catch (err) {
    console.error('Error fetching student bookings:', err);
    return res.status(500).json({ error: 'Failed to retrieve your bookings' });
  }
});

// DELETE /api/bookings/:id (Student only)
router.delete('/:id', requireAuth, requireRole('STUDENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id as string;
    const studentId = req.user!.id;

    const result = await bookingService.cancelBooking(bookingId, studentId);
    return res.json(result);
  } catch (err: any) {
    console.error('Error cancelling booking:', err);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({ error: err.message || 'Failed to cancel booking' });
  }
});

export default router;
