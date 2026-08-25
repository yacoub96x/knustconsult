"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../utils/validation.js");
const slotService_js_1 = require("../services/slotService.js");
const router = (0, express_1.Router)();
// POST /api/slots (Lecturer only)
router.post('/', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('LECTURER'), async (req, res) => {
    try {
        const parseResult = validation_js_1.createSlotSchema.safeParse(req.body);
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0];
            return res.status(400).json({ error: issue.message, field: issue.path[0]?.toString() });
        }
        const { date, startTime, endTime, isRecurring, recurringWeeks } = parseResult.data;
        const lecturerId = req.user.id;
        if (isRecurring) {
            const slots = await slotService_js_1.slotService.createRecurringSlots({
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
        }
        else {
            const slot = await slotService_js_1.slotService.createSlot({
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
    }
    catch (err) {
        console.error('Error creating slot:', err);
        return res.status(400).json({ error: err.message || 'Failed to create availability slot' });
    }
});
// GET /api/slots/mine (Lecturer only)
router.get('/mine', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('LECTURER'), async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const slots = await slotService_js_1.slotService.getLecturerSlots(lecturerId);
        return res.json({ slots });
    }
    catch (err) {
        console.error('Error fetching lecturer slots:', err);
        return res.status(500).json({ error: 'Failed to retrieve your slots' });
    }
});
// DELETE /api/slots/:id (Lecturer only)
router.delete('/:id', auth_js_1.requireAuth, (0, auth_js_1.requireRole)('LECTURER'), async (req, res) => {
    try {
        const slotId = req.params.id;
        const lecturerId = req.user.id;
        const result = await slotService_js_1.slotService.cancelSlot(slotId, lecturerId);
        return res.json(result);
    }
    catch (err) {
        console.error('Error cancelling slot:', err);
        const status = err.message?.includes('Unauthorized') ? 403 : 400;
        return res.status(status).json({ error: err.message || 'Failed to cancel slot' });
    }
});
exports.default = router;
