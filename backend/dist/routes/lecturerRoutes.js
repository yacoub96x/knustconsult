"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_js_1 = require("../middleware/auth.js");
const bookingService_js_1 = require("../services/bookingService.js");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/lecturers
router.get('/', auth_js_1.requireAuth, async (req, res) => {
    try {
        await bookingService_js_1.bookingService.cleanExpiredSlotsAndBookings();
        const todayStr = new Date().toISOString().split('T')[0];
        const searchParam = req.query.search;
        const search = typeof searchParam === 'string' ? searchParam : undefined;
        const whereCondition = {
            role: 'LECTURER',
            ...(search
                ? {
                    OR: [
                        { name: { contains: search } },
                        { department: { contains: search } },
                        { email: { contains: search } },
                    ],
                }
                : {}),
        };
        const lecturers = await prisma.user.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                createdAt: true,
                _count: {
                    select: {
                        slots: {
                            where: {
                                status: 'OPEN',
                                date: { gte: todayStr },
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return res.json({ lecturers });
    }
    catch (err) {
        console.error('Error fetching lecturers:', err);
        return res.status(500).json({ error: 'Failed to retrieve lecturers' });
    }
});
// GET /api/lecturers/:id/slots
router.get('/:id/slots', auth_js_1.requireAuth, async (req, res) => {
    try {
        await bookingService_js_1.bookingService.cleanExpiredSlotsAndBookings();
        const todayStr = new Date().toISOString().split('T')[0];
        const lecturerId = req.params.id;
        const lecturer = await prisma.user.findUnique({
            where: { id: lecturerId },
            select: { id: true, name: true, email: true, department: true, role: true },
        });
        if (!lecturer || lecturer.role !== 'LECTURER') {
            return res.status(404).json({ error: 'Lecturer not found' });
        }
        // Return OPEN, PENDING, and BOOKED slots so the student timetable grid
        // can show all active slot states and block requests on already-pending slots.
        const activeSlots = await prisma.availabilitySlot.findMany({
            where: {
                lecturerId,
                status: { in: ['OPEN', 'PENDING', 'BOOKED'] },
                date: { gte: todayStr },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
        return res.json({ lecturer, slots: activeSlots });
    }
    catch (err) {
        console.error('Error fetching lecturer slots:', err);
        return res.status(500).json({ error: 'Failed to retrieve lecturer availability slots' });
    }
});
exports.default = router;
