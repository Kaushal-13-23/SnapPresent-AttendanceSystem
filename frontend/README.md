# SnapPresent — Soft Snapshot Attendance Frontend

SnapPresent is a production-ready, biometric face-recognition attendance web application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Framer Motion**. It interfaces directly with the Flask + MongoDB + DeepFace/Facenet512 backend.

---

## 🎨 Design Direction: "Soft Snapshot"

Attendance moments are preserved as physical-feeling memory snapshots:
- **Polaroid Cards**: White frames with thicker bottom caption borders, slight rotation offsets, and develop-in animations.
- **Viewfinder**: Active camera viewports with rounded corner brackets in `lilac-deep` (`#8F76D9`) and sweeping scan-lines.
- **Shutter Flash**: White luminescent flash on snapshot capture and real-time matches.
- **Status Stamps**: Angled authentic stamps for `PRESENT` (mint) and `ABSENT` (rose).
- **Typography**:
  - Headings & Primary Metrics: **Bricolage Grotesque**
  - Body Copy: **DM Sans**
  - Timestamps, Confidence Scores & Student IDs: **DM Mono**

### Pastel Color Tokens & WCAG AA Contrast
| Token | Fill Value | Matching Ink Color | Purpose |
| :--- | :--- | :--- | :--- |
| **canvas** | `#FBF9FF` | `#2B2A3A` (`ink`) | Lavender-white page background |
| **surface** | `#FFFFFF` | `#2B2A3A` (`ink`) | Card & panel surfaces |
| **surface-tint** | `#F4EFFF` | `#6E6C86` (`ink-dim`) | Nested pill elements & skeletons |
| **line** | `#E7E0F5` | — | Hairline borders |
| **lilac** | `#C9B6F2` | `#2B2A3A` | Primary CTA buttons & accent badges |
| **lilac-deep**| `#8F76D9` | `#FFFFFF` | Focus rings, corner brackets & active links |
| **mint** | `#BDEBD6` | `#1F6B50` (`mint-ink`) | Present status stamps & positive pills |
| **rose** | `#FFC8D6` | `#8C2F4B` (`rose-ink`) | Absent status stamps & error alerts |
| **peach** | `#FFD3BD` | `#8A4A2B` (`peach-ink`) | Recorded duplicates & warnings |
| **sky** | `#BFE0FF` | `#24577F` (`sky-ink`) | Information tags & lecture chips |
| **butter** | `#FFF1B8` | `#7A6212` (`butter-ink`) | Pending status & tape accents |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or Node.js 20+
- Flask Backend running on `http://localhost:5000`

### 2. Environment Variables
Create `.env.local` inside the `frontend/` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Installation & Run
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Quality Check
```bash
# Type check with strict TypeScript
npx tsc --noEmit

# Run ESLint
npm run lint

# Compile optimized production bundle
npm run build
```

---

## 🧭 Page Architecture & Routes

### Public Pages
- `/` — **Landing Page**: Hero with developing polaroid stack, 3-step workflow, dual student/faculty tracks, privacy guarantee (only 512-D vectors stored, no raw pictures), and footer.
- `/signin` — **Sign In**: Student/Faculty role switch with spring-animated sliding pill.
- `/signup` — **Sign Up**: Role-aware registration (prompts Employee ID & Department for teachers).

### Authenticated Workspace (`/dashboard/*`)
- **Student Portal**:
  - `/dashboard/student` — Overview with enrollment badge, term attendance rate %, and recent lecture history.
  - `/dashboard/student/register` — 5-frame guided face capture (straight, left, right, chin up, neutral smile) with live viewfinder, polaroid thumbnails, retake, and submission to `/api/register-student`.
  - `/dashboard/student/attendance` — Attendance record logs with date/subject filters, stat cards, and status stamps.
  - `/dashboard/student/profile` — Academic identity management (email securely locked).
- **Faculty Portal**:
  - `/dashboard/faculty` — Overview with total students, face enrollment %, department breakdown, and AI model health.
  - `/dashboard/faculty/session` — Split-view live classroom attendance: camera viewfinder + sweeping scan line, 2s interval sampling with in-flight frame-drop prevention, real-time matched polaroids feed with confidence scores, duplicate avoidance, and final session summary.
  - `/dashboard/faculty/students` — Student directory with search, filter by dept/year/division, edit modal, and two-step delete confirmation.
  - `/dashboard/faculty/records` — Class attendance history with date/subject/division filters, presence rate analytics, and 1-click **SheetJS (.xlsx)** export.
