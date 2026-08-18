import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/lecturers
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
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
              where: { status: 'OPEN' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ lecturers });
  } catch (err) {
    console.error('Error fetching lecturers:', err);
    return res.status(500).json({ error: 'Failed to retrieve lecturers' });
  }
});

// GET /api/lecturers/:id/slots
router.get('/:id/slots', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lecturerId = req.params.id as string;

    const lecturer = await prisma.user.findUnique({
      where: { id: lecturerId },
      select: { id: true, name: true, email: true, department: true, role: true },
    });

    if (!lecturer || lecturer.role !== 'LECTURER') {
      return res.status(404).json({ error: 'Lecturer not found' });
    }

    const openSlots = await prisma.availabilitySlot.findMany({
      where: {
        lecturerId,
        status: 'OPEN',
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return res.json({ lecturer, slots: openSlots });
  } catch (err) {
    console.error('Error fetching lecturer slots:', err);
    return res.status(500).json({ error: 'Failed to retrieve lecturer availability slots' });
  }
});

export default router;
