# KnustConsult Backend API

RESTful API backend for the Lecturer–Student Consultation Booking System built with Node.js, Express, TypeScript, Prisma, and SQLite.

## System Prerequisites & Stack

- **Node.js**: v18+
- **Database**: SQLite (file-based `dev.db`, managed by Prisma ORM)
- **Auth**: JWT (stored in httpOnly cookie & Bearer tokens)
- **Validation**: Zod schema validation
- **Notifications**: Nodemailer with console log fallback for offline dev

## Setup & Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment File**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Prisma Database Setup & Seed**:
   Run database migrations and populate realistic seed data:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:5000`.

---

## API Documentation

### Auth Endpoints

| Method | Endpoint | Auth | Description | Request Body | Response Shape |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new Lecturer or Student | `{ name, email, password, role, department? }` | `{ user, token, message }` |
| `POST` | `/api/auth/login` | Public | Login to account | `{ email, password }` | `{ user, token, message }` |
| `POST` | `/api/auth/logout` | Public | Clear auth cookie | None | `{ message }` |
| `GET` | `/api/auth/me` | Authenticated | Get current logged-in user | None | `{ user }` |

### Lecturer Directory Endpoints

| Method | Endpoint | Auth | Description | Query / Params | Response Shape |
|---|---|---|---|---|---|
| `GET` | `/api/lecturers` | Authenticated | List/search lecturers | `?search=nameOrDept` | `{ lecturers: [...] }` |
| `GET` | `/api/lecturers/:id/slots` | Authenticated | Get open slots for a lecturer | `:id` (lecturer UUID) | `{ lecturer, slots: [...] }` |

### Availability Slot Endpoints

| Method | Endpoint | Auth | Description | Request Body | Response Shape |
|---|---|---|---|---|---|
| `POST` | `/api/slots` | Lecturer Only | Create single or recurring slots | `{ date, startTime, endTime, isRecurring?, recurringWeeks? }` | `{ message, slot \| slots }` |
| `GET` | `/api/slots/mine` | Lecturer Only | Get lecturer's own slots & bookings | None | `{ slots: [...] }` |
| `DELETE` | `/api/slots/:id` | Lecturer Only | Cancel slot & associated bookings | `:id` (slot UUID) | `{ message }` |

### Consultation Booking Endpoints

| Method | Endpoint | Auth | Description | Request Body | Response Shape |
|---|---|---|---|---|---|
| `POST` | `/api/bookings` | Student Only | Book an open slot (Transactional) | `{ slotId }` | `{ message, booking }` |
| `GET` | `/api/bookings/mine` | Student Only | Get student's own bookings | None | `{ bookings: [...] }` |
| `DELETE` | `/api/bookings/:id` | Student Only | Cancel own booking & reopen slot | `:id` (booking UUID) | `{ message }` |
