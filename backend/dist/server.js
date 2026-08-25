"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const PORT = parseInt(process.env.PORT || '5000', 10);
app_js_1.default.listen(PORT, () => {
    console.log(`\n🚀 KnustConsult Backend API Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health\n`);
});
