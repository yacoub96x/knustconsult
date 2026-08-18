# KnustConsult Frontend

React + Vite + TypeScript web client for the Lecturer–Student Consultation Booking System. Styled with Tailwind CSS and animated using Framer Motion (including 21st.dev `ContainerScroll` scroll interaction component).

## System Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State & Server Query**: `@tanstack/react-query`
- **HTTP Client**: Axios abstraction layer (`src/api/client.ts` & `src/api/services.ts`)

## Setup & Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment File**:
   Ensure `.env` exists (copied from `.env.example`):
   ```bash
   VITE_API_URL="http://localhost:5000/api"
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The frontend app will launch at `http://localhost:5173`.

4. **Build & Type Check**:
   ```bash
   npm run lint
   npm run build
   ```

---

## Code Architecture

- `src/api/`: Centralized typed API client. No components make direct `fetch` calls.
- `src/components/ui/container-scroll-animation.tsx`: Interactive scroll UI component.
- `src/context/AuthContext.tsx`: Manages authentication state, user session, and credentials.
- `src/pages/`:
  - `LandingPage.tsx`: Hero visual landing page featuring ContainerScroll.
  - `LoginPage.tsx`: Authentication screen with demo account quick-login shortcuts.
  - `RegisterPage.tsx`: Role selection (Lecturer or Student) and profile registration.
  - `LecturerDashboard.tsx`: Single/recurring availability creation modal, confirmed student bookings list, and slot deletion.
  - `StudentDashboard.tsx`: Lecturer directory search by name/department, open slot selector, instant booking with double-booking feedback, and booking cancellation.
