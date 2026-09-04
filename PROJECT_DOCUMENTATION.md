# 📚 KnustConsult — Complete Project Documentation

**KnustConsult** is a modern, AI-powered Lecturer Availability & Student Appointment Booking System designed for **Kwame Nkrumah University of Science and Technology (KNUST)**.

---

## 📌 Executive Summary

KnustConsult solves scheduling conflicts between university lecturers and students by providing:
1. **AI Voice & Natural Language Schedule Publishing**: Lecturers speak or type their available hours (e.g. *"Available tomorrow 10am to 12pm"*), and the system automatically extracts structured date/time slots using browser Web Speech API and Google Gemini AI.
2. **Interactive Student Timetable & Booking Matrix**: Students browse lecturers by department, view real-time availability grids, and reserve consultation slots.
3. **Digital Boarding Pass Tickets & Instant Email Notifications**: Students receive styled boarding-pass appointment passes with approval status updates sent directly to their email via SMTP.

---

## 🏗️ System Architecture & Technology Stack

### 1. Core Stack
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Fast, responsive single-page application with TypeScript |
| **Styling & UI** | TailwindCSS + Framer Motion | Modern dark/light mode design system with rich micro-animations |
| **Backend Framework** | Express.js (Node.js + TS) | RESTful API server with modular routing and middleware |
| **Database & ORM** | Prisma ORM + SQLite | Type-safe database queries with lightweight file-based SQLite database |
| **AI Voice & Speech** | Web Speech API + Gemini AI | Browser `SpeechRecognition` for live transcription + Google Gemini AI for date/time resolution |
| **Email Service** | Nodemailer (SMTP) | Automated transactional HTML email notifications for booking confirmations & approvals |
| **Authentication** | JWT (JSON Web Tokens) + Bcrypt | Secure role-based authentication (`LECTURER`, `STUDENT`) |

---

## 🗄️ Database Schema & Data Models

### Prisma Schema Definition (`backend/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  LECTURER
  STUDENT
}

enum SlotStatus {
  OPEN
  BOOKED
  CANCELLED
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model User {
  id         String             @id @default(uuid())
  name       String
  email      String             @unique
  password   String
  role       Role               @default(STUDENT)
  department String?            @default("Computer Science")
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt
  slots      AvailabilitySlot[] @relation("LecturerSlots")
  bookings   Booking[]          @relation("StudentBookings")
}

model AvailabilitySlot {
  id             String        @id @default(uuid())
  lecturerId     String
  lecturer       User          @relation("LecturerSlots", fields: [lecturerId], references: [id], onDelete: Cascade)
  date           String        // YYYY-MM-DD
  startTime      String        // HH:mm
  endTime        String        // HH:mm
  status         SlotStatus    @default(OPEN)
  isRecurring    Boolean       @default(false)
  recurringWeeks Int?          @default(4)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  bookings       Booking[]
}

model Booking {
  id        String           @id @default(uuid())
  slotId    String
  slot      AvailabilitySlot @relation(fields: [slotId], references: [id], onDelete: Cascade)
  studentId String
  student   User             @relation("StudentBookings", fields: [studentId], references: [id], onDelete: Cascade)
  subject   String?
  status    BookingStatus    @default(PENDING)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}
```

---

## 🎤 AI Voice & Natural Language Parsing Pipeline

```
┌─────────────────────────┐      1. Live Audio Waveform      ┌─────────────────────────┐
│ Browser Microphone Input │ ──────────────────────────────> │ Browser Web Speech API  │
└─────────────────────────┘                                  └─────────────────────────┘
                                                                          │
                                                                          │ 2. Live Text Transcript
                                                                          ▼
┌─────────────────────────┐      4. Parsed Slots JSON        ┌─────────────────────────┐
│ Form Auto-Fill (Date &  │ <─────────────────────────────── │ Express Backend API     │
│ Time Inputs)            │                                  │ (/api/slots/parse-voice)│
└─────────────────────────┘                                  └─────────────────────────┘
                                                                          │
                                                                          │ 3. Text + Date Context
                                                                          ▼
                                                             ┌─────────────────────────┐
                                                             │ Dual AI Parsing Engine  │
                                                             │  a) Google Gemini AI    │
                                                             │  b) Instant 5ms Fallback│
                                                             └─────────────────────────┘
```

### Dual-Engine Resilience Architecture
1. **Primary Engine**: Google Gemini AI (`gemini-3.6-flash` / `gemini-1.5-flash`) resolves complex natural language dates relative to current university calendars with a **10-second request timeout**.
2. **Instant Fallback Engine**: If Gemini API quota is exhausted (`429`) or offline, the backend seamlessly switches to a local rule-based regex parser (`heuristicParseTranscript`) in **< 5 milliseconds**. The UI never hangs or crashes.

---

## 🔌 API Reference Guide

### 1. Authentication Routes (`/api/auth`)
- **`POST /api/auth/register`**: Register a new user (`LECTURER` or `STUDENT`).
- **`POST /api/auth/login`**: Authenticate and receive a JWT token.
- **`POST /api/auth/logout`**: Terminate session.
- **`GET /api/auth/me`**: Get currently authenticated user profile.

### 2. Availability Slot Routes (`/api/slots`)
- **`POST /api/slots/parse-voice`**: Parse natural language text into structured date/time slots.
- **`POST /api/slots`**: Publish single or weekly recurring availability slots.
- **`GET /api/slots/mine`**: Fetch all slots published by the logged-in lecturer.
- **`DELETE /api/slots/:id`**: Cancel an availability slot.

### 3. Lecturer Directory Routes (`/api/lecturers`)
- **`GET /api/lecturers`**: List all university lecturers (with optional search query).
- **`GET /api/lecturers/:id/slots`**: Fetch open availability slots for a specific lecturer.

### 4. Booking Routes (`/api/bookings`)
- **`POST /api/bookings`**: Student reserves an open slot.
- **`GET /api/bookings/mine`**: Fetch bookings for current student or lecturer.
- **`POST /api/bookings/:id/approve`**: Lecturer approves booking (triggers student email notification).
- **`POST /api/bookings/:id/reject`**: Lecturer declines booking (opens slot back up).
- **`DELETE /api/bookings/:id`**: Student cancels a booking.

---

## 🛠️ Project Setup & Installation Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone & Configure Backend
```bash
cd backend
npm install
```

Create `backend/.env` file:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="knust_consult_secret_jwt_key_2026_super_secure"
PORT=5000
FRONTEND_URL="http://localhost:5173"

# Optional SMTP settings for email notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@knust.edu.gh"

# Google Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"
```

Initialize Database & Start Backend:
```bash
npx prisma db push
npm run dev
```

### 2. Configure & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and communicate with backend on `http://localhost:5000`.

---

## 🔒 Security & Best Practices
- **Environment Isolation**: Sensitive keys (`GEMINI_API_KEY`, `SMTP_PASS`, `JWT_SECRET`) are stored strictly in `.env` files and excluded from Git repository tracking via `.gitignore`.
- **Validation**: All incoming API requests are validated with `Zod` schemas.
- **Authentication Guard**: Protected routes verify JWT bearer tokens and enforce role authorization (`requireAuth`, `requireRole`).

---

© 2026 **KnustConsult** — Kwame Nkrumah University of Science and Technology.
