"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const lecturerRoutes_js_1 = __importDefault(require("./routes/lecturerRoutes.js"));
const slotRoutes_js_1 = __importDefault(require("./routes/slotRoutes.js"));
const bookingRoutes_js_1 = __importDefault(require("./routes/bookingRoutes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// CORS configuration
app.use((0, cors_1.default)({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/lecturers', lecturerRoutes_js_1.default);
app.use('/api/slots', slotRoutes_js_1.default);
app.use('/api/bookings', bookingRoutes_js_1.default);
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});
exports.default = app;
