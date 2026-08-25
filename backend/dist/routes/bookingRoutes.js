"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../utils/validation.js");
const bookingService_js_1 = require("../services/bookingService.js");
const router = (0, express_1.Router)();
// POST /api/bookings (Student only)
router.post('/', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('STUDENT'), async (req, res) => {
    try {
        const parseResult = validation_js_1.bookSlotSchema.safeParse(req.body);
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0];
            return res.status(400).json({ error: issue.message, field: issue.path[0]?.toString() });
        }
        const { slotId, subject } = parseResult.data;
        const studentId = req.user.id;
        const booking = await bookingService_js_1.bookingService.bookSlot(slotId, studentId, subject);
        return res.status(201).json({
            message: 'Booking request submitted — awaiting lecturer approval',
            booking,
        });
    }
    catch (err) {
        console.error('Error booking slot:', err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message || 'Failed to book slot' });
    }
});
// GET /api/bookings/mine (Student only)
router.get('/mine', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('STUDENT'), async (req, res) => {
    try {
        const studentId = req.user.id;
        const bookings = await bookingService_js_1.bookingService.getStudentBookings(studentId);
        return res.json({ bookings });
    }
    catch (err) {
        console.error('Error fetching student bookings:', err);
        return res.status(500).json({ error: 'Failed to retrieve your bookings' });
    }
});
// POST /api/bookings/:id/approve (Lecturer only)
router.post('/:id/approve', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('LECTURER'), async (req, res) => {
    try {
        const bookingId = req.params.id;
        const lecturerId = req.user.id;
        const result = await bookingService_js_1.bookingService.approveBooking(bookingId, lecturerId);
        return res.json(result);
    }
    catch (err) {
        console.error('Error approving booking:', err);
        const statusCode = err.statusCode || 400;
        return res.status(statusCode).json({ error: err.message || 'Failed to approve booking' });
    }
});
// POST /api/bookings/:id/reject (Lecturer only)
router.post('/:id/reject', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('LECTURER'), async (req, res) => {
    try {
        const bookingId = req.params.id;
        const lecturerId = req.user.id;
        const result = await bookingService_js_1.bookingService.rejectBooking(bookingId, lecturerId);
        return res.json(result);
    }
    catch (err) {
        console.error('Error rejecting booking:', err);
        const statusCode = err.statusCode || 400;
        return res.status(statusCode).json({ error: err.message || 'Failed to reject booking' });
    }
});
// DELETE /api/bookings/:id/clear (Student or Lecturer - delete CANCELLED or REJECTED booking)
router.delete('/:id/clear', auth_js_1.requireAuth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;
        const result = await bookingService_js_1.bookingService.deleteCancelledBooking(bookingId, userId);
        return res.json(result);
    }
    catch (err) {
        console.error('Error deleting cancelled booking:', err);
        const statusCode = err.statusCode || 400;
        return res.status(statusCode).json({ error: err.message || 'Failed to delete cancelled booking' });
    }
});
// DELETE /api/bookings/:id (Student only — only for CONFIRMED bookings)
router.delete('/:id', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('STUDENT'), async (req, res) => {
    try {
        const bookingId = req.params.id;
        const studentId = req.user.id;
        const result = await bookingService_js_1.bookingService.cancelBooking(bookingId, studentId);
        return res.json(result);
    }
    catch (err) {
        console.error('Error cancelling booking:', err);
        const statusCode = err.statusCode || 400;
        return res.status(statusCode).json({ error: err.message || 'Failed to cancel booking' });
    }
});
exports.default = router;
