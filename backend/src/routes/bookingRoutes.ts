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

    const { slotId, subject } = parseResult.data;
    const studentId = req.user!.id;

    const booking = await bookingService.bookSlot(slotId, studentId, subject);

    return res.status(201).json({
      message: 'Booking request submitted — awaiting lecturer approval',
      booking,
    });
  } catch (err: any) {
    console.error('Error booking slot:', err);
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'The specified slot or user account no longer exists. Please refresh or log in again.' });
    }
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

// POST /api/bookings/:id/approve (Lecturer only)
router.post('/:id/approve', requireAuth, requireRole('LECTURER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id as string;
    const lecturerId = req.user!.id;

    const result = await bookingService.approveBooking(bookingId, lecturerId);
    return res.json(result);
  } catch (err: any) {
    console.error('Error approving booking:', err);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({ error: err.message || 'Failed to approve booking' });
  }
});

// POST /api/bookings/:id/reject (Lecturer only)
router.post('/:id/reject', requireAuth, requireRole('LECTURER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id as string;
    const lecturerId = req.user!.id;

    const result = await bookingService.rejectBooking(bookingId, lecturerId);
    return res.json(result);
  } catch (err: any) {
    console.error('Error rejecting booking:', err);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({ error: err.message || 'Failed to reject booking' });
  }
});

// DELETE /api/bookings/:id/clear (Student or Lecturer - delete CANCELLED or REJECTED booking)
router.delete('/:id/clear', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id as string;
    const userId = req.user!.id;

    const result = await bookingService.deleteCancelledBooking(bookingId, userId);
    return res.json(result);
  } catch (err: any) {
    console.error('Error deleting cancelled booking:', err);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({ error: err.message || 'Failed to delete cancelled booking' });
  }
});

// DELETE /api/bookings/:id (Student only — only for CONFIRMED bookings)
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
