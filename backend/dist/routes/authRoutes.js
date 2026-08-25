"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const validation_js_1 = require("../utils/validation.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'knust_consult_secret_jwt_key_2026_super_secure';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const parseResult = validation_js_1.registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0];
            return res.status(400).json({ error: issue.message, field: issue.path[0]?.toString() });
        }
        const { name, email, password, role, department } = parseResult.data;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists', field: 'email' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
                department: department || null,
            },
        });
        const tokenPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, COOKIE_OPTIONS);
        return res.status(201).json({
            user: tokenPayload,
            token,
            message: 'Account registered successfully',
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Failed to register account' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const parseResult = validation_js_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0];
            return res.status(400).json({ error: issue.message, field: issue.path[0]?.toString() });
        }
        const { email, password } = parseResult.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const tokenPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, COOKIE_OPTIONS);
        return res.json({
            user: tokenPayload,
            token,
            message: 'Logged in successfully',
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Failed to log in' });
    }
});
// POST /api/auth/logout
router.post('/logout', (_req, res) => {
    res.clearCookie('token');
    return res.json({ message: 'Logged out successfully' });
});
// GET /api/auth/me
router.get('/me', auth_js_1.requireAuth, (req, res) => {
    return res.json({ user: req.user });
});
exports.default = router;
