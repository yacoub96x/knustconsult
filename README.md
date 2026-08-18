# Lecturer–Student Consultation Booking System (KnustConsult)

A production-ready full-stack monorepo system designed for university faculty and students to manage consultation office hours, eliminate availability guesswork, and secure one-on-one consultation bookings with real-time email notifications and atomic double-booking prevention.

---

## 📁 Repository Structure

```
KnustConsult/
├── backend/                  → Node.js + Express + TypeScript + Prisma + SQLite
│   ├── prisma/
│   │   ├── schema.prisma     → User, AvailabilitySlot, Booking models
│   │   └── seed.ts           → Realistic demo data generator
│   ├── src/
│   │   ├── middleware/       → JWT Auth & Role Guards
│   │   ├── routes/           → REST API endpoints (/auth, /lecturers, /slots, /bookings)
│   │   └── services/         → slotService, bookingService, emailService
│   ├── package.json
│   └── README.md
├── frontend/                 → React + Vite + TypeScript + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── api/              → Typed API client layer (Axios)
│   │   ├── components/       → Navbar, Guards, 21st.dev ContainerScroll component
│   │   ├── context/          → AuthContext
│   │   ├── pages/            → Landing, Login, Register, Lecturer & Student Dashboards
│   │   └── types/            → Shared TypeScript domain types
│   ├── package.json
│   └── README.md
└── README.md                 → Top-level instructions
```

---

## ⚡ Quick Start Guide (Run Both Apps)

### 1. Backend Setup & Database Migration

Open a terminal in `/backend`:

```bash
cd backend
cmd.exe /c "npm install"

# Run Prisma migrations & seed demo data
cmd.exe /c "npx prisma migrate dev --name init"
cmd.exe /c "npx prisma db seed"

# Start the REST API server
cmd.exe /c "npm run dev"
```
*The backend API server will run on `http://localhost:5000`.*

---

### 2. Frontend Setup

Open a second terminal in `/frontend`:

```bash
cd frontend
cmd.exe /c "npm install"

# Start Vite dev server
cmd.exe /c "npm run dev"
```
*The frontend web application will launch at `http://localhost:5173`.*

---

## 🔑 Demo Account Credentials

Default Password for all seed accounts: **`password123`**

### 👨‍🏫 Lecturers
| Name | Department | Email |
|---|---|---|
| **Dr. Kwabena Mensah** | Computer Science | `dr.mensah@knust.edu.gh` |
| **Prof. Ama Serwaa** | Electrical Engineering | `prof.serwaa@knust.edu.gh` |
| **Dr. Yaw Osei** | Mathematics & Statistics | `dr.osei@knust.edu.gh` |

### 🎓 Students
| Name | Department | Email |
|---|---|---|
| **Kwame Appiah** | Computer Science | `kwame.appiah@st.knust.edu.gh` |
| **Abena Owusu** | Electrical Engineering | `abena.owusu@st.knust.edu.gh` |
| **Kofi Boakye** | Mathematics & Statistics | `kofi.boakye@st.knust.edu.gh` |

> 💡 **Tip**: Click the **Quick Demo Logins** preset buttons on the `/login` page for instant one-click login!

---

## 🛡️ Key Features & Architecture

1. **Transactional Double-Booking Locks**:
   `bookingService.ts` uses Prisma `$transaction` combined with a unique database constraint `@unique` on `Booking(slotId)`. Even under simultaneous concurrent student requests, only one booking can be committed.
2. **Modular Service Function for Slot Creation**:
   All single and recurring slot creation logic resides strictly inside `slotService.ts` (isolated from HTTP route handlers). This preserves architectural purity for future v2 AI/LLM voice-command parsing pathways.
3. **Offline Email Notification System**:
   `emailService.ts` utilizes Nodemailer. If SMTP environment variables are unconfigured, emails fallback automatically to pretty-printed console log outputs without interrupting application flow or throwing errors.
4. **21st.dev Container Scroll Visual UI**:
   Integrated Framer Motion `ContainerScroll` visual card animation on the landing page, adhering to modern academic web aesthetic standards.
