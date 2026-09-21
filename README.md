# 🎓 College Event Hub

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application for managing college events end-to-end — from event creation and student registration to QR-based attendance, results/winner publication, and certificate release.

This README is generated **directly from the current source code** in this repository (`backend/` and `frontend/`) and describes only what is actually implemented.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Feature List](#4-feature-list)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Student Workflow](#6-student-workflow)
7. [Admin Workflow](#7-admin-workflow)
8. [Super Admin Workflow](#8-super-admin-workflow)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Backend Architecture](#10-backend-architecture)
11. [Middleware](#11-middleware)
12. [Database & Models](#12-database--models)
13. [API Routes](#13-api-routes)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [Email & OTP Verification](#15-email--otp-verification)
16. [QR Code Functionality](#16-qr-code-functionality)
17. [Event Creation & Management](#17-event-creation--management)
18. [Date/Time/Venue Conflict Prevention](#18-datetimevenue-conflict-prevention)
19. [Seat Capacity & Registration Control](#19-seat-capacity--registration-control)
20. [Payment Functionality](#20-payment-functionality)
21. [Event Status & Completed Event Workflow](#21-event-status--completed-event-workflow)
22. [Attendance Functionality](#22-attendance-functionality)
23. [Results & Winner Management](#23-results--winner-management)
24. [Prize Management (1st / 2nd / 3rd)](#24-prize-management)
25. [Certificate Functionality](#25-certificate-functionality)
26. [Notifications](#26-notifications)
27. [Security Features](#27-security-features)
28. [Validation Mechanisms](#28-validation-mechanisms)
29. [Project Folder Structure](#29-project-folder-structure)
30. [Database Relationships](#30-database-relationships)
31. [Complete System Workflow](#31-complete-system-workflow)
32. [Installation Requirements](#32-installation-requirements)
33. [Environment Variables](#33-environment-variables)
34. [Running the Backend](#34-running-the-backend)
35. [Running the Frontend](#35-running-the-frontend)
36. [API Documentation](#36-api-documentation)
37. [Testing Overview](#37-testing-overview)
38. [Future Enhancements](#38-future-enhancements)
39. [Final Project Summary](#39-final-project-summary)

---

## 1. Project Overview

**College Event Hub** is a role-based event management platform built for a college (the codebase is specifically configured for **Sri Shanmugha College**, domain `@shanmugha.edu.in`) that lets:

- **Internal students** (verified via a college ID card) and **external students** (from other colleges) discover and register for events.
- **Admins** create/manage events, verify attendance via QR scanning, publish results, and release certificates.
- A **Super Admin** approve new admin accounts and manage the admin roster.

The backend is an **Express + MongoDB (Mongoose)** REST API (`backend/`), and the frontend is a **React 19 + Vite** single-page application (`frontend/`) styled with Tailwind CSS, using Framer Motion (`motion`) and Three.js (`@react-three/fiber`) for visual/3D effects.

## 2. Problem Statement

Colleges running technical/cultural/sports events typically rely on manual, paper-based or spreadsheet-based processes for:

- Registration (with no protection against double-booking a venue/time-slot or overselling seats).
- Verifying that a registrant is a genuine student of the college (ID card verification is often skipped or done manually).
- Tracking attendance at the event (physical sign-in sheets).
- Publishing results and manually creating/distributing certificates.
- Broadcasting announcements or personal notifications to participants.

This creates duplication of effort, scheduling conflicts, lost paperwork, and no verifiable/searchable trail of certificates or winners.

## 3. Proposed Solution

College Event Hub centralizes the entire event lifecycle in a single web application:

- Students self-register with **OTP-verified email**, and internal students additionally verify their identity through an **AI-assisted ID-card OCR + hologram check**.
- Admins create events through a form that **automatically prevents double-booking** a venue/time slot (checked both in application logic and enforced by a MongoDB unique compound index).
- Seats are tracked with **atomic MongoDB updates** to avoid race conditions when many students register concurrently.
- Attendance is captured by **scanning a unique QR code** issued to each registration.
- Certificates are **auto-generated in the browser (PDF)** and can be verified by a public verification code/certificate number.
- Winners (1st/2nd/3rd) are recorded directly on the event and shown on a public results page.
- A background job **automatically transitions each event's status** (`upcoming → ongoing → completed`) based on real time (IST-corrected), which also auto-closes registration.

---

## 4. Feature List

Below is a feature list derived strictly from the implemented controllers/routes/pages — nothing invented.

| Category | Feature |
|---|---|
| Authentication | Email/password registration + login for Students (Internal/External) and Admins |
| Authentication | OTP email verification (6-digit, bcrypt-hashed, 5-minute expiry) before an account is created |
| Authentication | Google OAuth login (auto-registers internal students on first sign-in) |
| Authentication | JWT-based session (30-day expiry) |
| Identity Verification | AI-assisted College ID card verification: hologram pixel-pattern check + Tesseract.js OCR extraction of the student's SIN/register number |
| Identity Verification | QR/barcode based college-student pre-verification (`CollegeStudent` master list) before self-registration |
| Events | Create / update / delete events with poster, category, schedule, rules, prizes, coordinators, brochure URL |
| Events | Public event listing with filters: status, category, price type (free/paid), text search |
| Events | Auto status engine: `upcoming → ongoing → completed` (IST-aware, runs every 60s + on every fetch) |
| Events | Venue/time-slot double-booking prevention (app-level overlap check + DB unique index) |
| Events | Fixed-hour venue availability grid (`booked-slots` endpoint) for the Create Event admin UI |
| Events | Manual open/close toggle for registration per event |
| Registration | Individual and team registrations (team size 2–4, all member details captured) |
| Registration | Free events auto-approved instantly; paid events held until payment is verified |
| Registration | Atomic seat-count increment to prevent overselling under concurrent load |
| Registration | Auto-close registration once seat limit is reached |
| Registration | Students can cancel their own **pending** (unpaid) registrations |
| Registration | Admin can manually add a registration on behalf of a student |
| Registration | Admin can approve/reject/delete registrations (adjusts seat counts accordingly) |
| Payments | Razorpay order creation + signature verification |
| Payments | Built-in **mock/test payment mode** when Razorpay keys are placeholders (for local development/demo) |
| Payments | Payment history (student) and full payment ledger (admin) |
| QR Codes | Unique secure QR token per registration (`uuid`), embedded as JSON (`registrationId` + `token`) |
| QR Codes | QR code preview/download (PNG & PDF) for students |
| QR Codes | Admin QR Scanner (camera-based, `html5-qrcode`) to mark attendance |
| Attendance | One attendance record per student per event (DB-enforced unique index) |
| Attendance | Marking attendance auto-generates the certificate record and sends notifications |
| Attendance | Per-event attendance list for admins |
| Certificates | Certificate eligibility list (per event or across all events) |
| Certificates | Single and bulk certificate approval/release by admin |
| Certificates | Auto-generated sequential certificate numbers (`CERT-YYYY-000001`) |
| Certificates | Client-side certificate **PDF generation** (jsPDF) with a styled template and embedded QR verification code |
| Certificates | Public certificate verification endpoint (by certificate number or verification code) |
| Results | Admin publishes 1st/2nd/3rd place winners (name, college, department, year, prize type, cash amount, photo URL) per event |
| Results | Public event results/winners page |
| Notifications | In-app per-user notifications (registration, payment, event, certificate, announcement types) |
| Notifications | Admin bulk announcements (to all / internal-only / external-only students) |
| Notifications | Mark-as-read |
| Admin Management | Super Admin approves/rejects new admin sign-ups |
| Admin Management | Super Admin can create, edit, deactivate, or delete admin accounts |
| Account Management | Students can submit an **account deletion request**; admin can approve (cascading delete of registrations & certificates) or deny |
| Dashboards | Admin analytics: total students/events/registrations/payments/revenue, revenue-by-month chart, category distribution chart, weekly registration chart |
| UI/UX | Dark/light theme, animated 3D hero scene, glassmorphism UI, confetti effects, rule-based AI chatbot assistant (FAQ-style, no external LLM call) |
| Media | Cloudinary configuration present for image uploads (via Multer memory storage) |

---

## 5. User Roles & Permissions

The system defines **three logical roles**, stored in three separate Mongoose collections/models:

| Role | Model | Description |
|---|---|---|
| **Student (Internal)** | `StudentInternal` | Verified Sri Shanmugha College student. Must log in with an `@shanmugha.edu.in` email. Can also sign in with Google OAuth (restricted to `@shanmugha.edu.in` or `@gmail.com` for testing). |
| **Student (External)** | `StudentExternal` | Student from another college. Registers with college name, department, ID card image, etc. |
| **Admin** | `Admin` (`role: 'admin'`) | College staff who manage events, registrations, attendance, certificates, results, and announcements. New admin sign-ups require Super Admin approval before they can log in. |
| **Super Admin** | `Admin` (`role: 'super_admin'`) | The top-level admin. First admin created with email `e23cs021@shanmugha.edu.in` is auto-promoted to `super_admin` and auto-approved; all others start as `admin` in `pending` approval status. |

**Route-level permission enforcement** (`middleware/admin.js`):

- `adminOnly` — allows `role === 'admin'` **or** `role === 'super_admin'`.
- `superAdminOnly` — allows only `role === 'super_admin'`.

| Capability | Student | Admin | Super Admin |
|---|:---:|:---:|:---:|
| Browse/register for events | ✅ | ✅ (view only) | ✅ (view only) |
| Create/edit/delete events | ❌ | ✅ | ✅ |
| Approve/reject registrations | ❌ | ✅ | ✅ |
| Scan QR / mark attendance | ❌ | ✅ | ✅ |
| Approve/release certificates | ❌ | ✅ | ✅ |
| Publish event results/winners | ❌ | ✅ | ✅ |
| Send announcements | ❌ | ✅ | ✅ |
| Approve/deny account-deletion requests | ❌ | ✅ | ✅ |
| Approve/reject/deactivate/delete **admin** accounts | ❌ | ❌ | ✅ |
| Create new admin accounts | ❌ | ❌ | ✅ |

---

## 6. Student Workflow

1. **Sign Up**
   - *Internal student*: uploads/scans their college ID (SIN extracted via OCR, or entered manually), fills the registration form, and submits.
   - *External student*: fills the registration form directly (name, college, department, year, ID card upload, etc.).
2. **OTP Verification** — a 6-digit OTP is emailed; entering it within 5 minutes creates the actual account (`StudentInternal`/`StudentExternal`) from the temporary `PendingRegistration` record.
3. **Login** — email + password, or Google login (internal students only).
4. **Browse Events** (`/events`) — filter by category, price type, or status; search by keyword.
5. **Register for an Event** (`RegistrationModal`) — choose individual or team registration; fill participant details.
   - **Free event** → registration is instantly `approved`, a QR code + secure token is generated.
   - **Paid event** → redirected to Razorpay checkout (or the built-in mock-payment flow in development); registration record is only created after payment verification succeeds.
6. **Dashboard** (`/dashboard`) — view "My Registrations", download the event QR code (PNG/PDF).
7. **Attend the Event** — admin scans the student's QR code at the venue to mark attendance (auto-flips `attendanceStatus` and generates the certificate record).
8. **Completed Events** (`/completed-events`) — view past events and, if published, their results/winners.
9. **Certificates** (`/certificates`) — once an admin releases the certificate, the student can view/download a generated PDF certificate.
10. **Profile** — view/manage account details.
11. **Account Deletion** — a student may submit a deletion request; once an admin approves it, the account and all related registrations/certificates are permanently deleted.

## 7. Admin Workflow

1. **Sign Up** → OTP-verified → account created with `approvalStatus: 'pending'`, `isActive: false` (unless the email is the designated main super admin).
2. **Wait for Super Admin approval** before being able to log in (unless auto-approved super admin).
3. **Dashboard** (`/admin`) — key stats (students, events, registrations, revenue, attendance, certificates released) and charts (revenue by month, category split, weekly registration trend).
4. **Create Event** (`/admin/create-event`) — set title, description, poster, category, date/time, venue (with a live venue-availability grid to avoid clashes), pricing (internal/external), seat limit, schedule, rules, prizes, coordinators.
5. **Manage Events** (`/admin/events`) — edit, delete (cascades to related registrations/payments/certificates/attendance), toggle registration open/closed.
6. **Registrations** (`/admin/students`) — view all registrations, approve/reject, manually add a registration, delete a registration.
7. **QR Scanner** (`/admin/scanner`) — scan a student's QR at the event to mark attendance; the system automatically creates the certificate record and sends the student 3 notifications (attendance verified, certificate generated, certificate ready).
8. **Certificate Release** (`/admin/certificates`) — view eligible students (present + paid/free) and approve certificates individually or in bulk per event.
9. **Results Management** (`/admin/results`) — publish 1st/2nd/3rd place winners for a completed event.
10. **Announcements** (`/admin/announcements`) — broadcast a notification to all students, internal-only, or external-only.
11. **Deletion Requests** (`/admin/deletion-requests`) — approve or deny student account-deletion requests.
12. **ID Verification / College Students List** (`/admin/id-verification`) — manage the master `CollegeStudent` list used to pre-verify internal students during sign-up (add single, bulk import, enable/disable).

## 8. Super Admin Workflow

In addition to everything an Admin can do, the Super Admin gets two extra sidebar sections:

1. **Admin Approval** (`/admin/requests`) — view pending admin sign-up requests and Approve / Reject / Deactivate them. Approving activates the account and emails the new admin; rejecting sends a rejection email.
2. **Admin Management** (`/admin/management`) — list all admins, create a new admin directly (OTP-verified), update an admin's details/role, toggle status, or delete an admin (cannot delete or deactivate their own account).

---

## 9. Frontend Technology and Architecture

**Location:** `frontend/`

| Layer | Technology (from `frontend/package.json`) |
|---|---|
| Framework | React `19.2.7` + React DOM `19.2.7` |
| Build tool | Vite `8.1.0` (`@vitejs/plugin-react`) |
| Routing | `react-router-dom` `7.18.0` |
| Styling | Tailwind CSS `3.4.19` + `postcss`/`autoprefixer` |
| Animation | `motion` (Framer Motion) `12.42.0`, `canvas-confetti` |
| 3D Graphics | `three` `0.185.0`, `@react-three/fiber`, `@react-three/drei` |
| Forms | `react-hook-form` `7.80.0` |
| HTTP client | `axios` `1.18.1` |
| State (auxiliary) | `zustand` `5.0.14` (+ React Context for auth/theme) |
| Charts | `recharts` `3.9.0` |
| QR Codes | `qrcode.react`, `qrcode`, `html5-qrcode` |
| PDF/Excel | `jspdf`, `html2canvas`, `xlsx` |
| OAuth | `@react-oauth/google` |
| Icons | `react-icons` |
| Toasts | `react-hot-toast` |
| Linting | `oxlint` |

**Architecture**

- `main.jsx` mounts `<App />`.
- `App.jsx` wraps the app in `ThemeProvider` and `AuthProvider`, defines all routes, and conditionally renders the `Sidebar` on dashboard/admin/profile routes.
- **Context layer**: `AuthContext.jsx` (JWT/session state, login/register/OTP/Google login, stored in `sessionStorage`), `ThemeContext.jsx` (dark/light mode).
- **Service layer** (`src/services/`): thin wrappers around the shared Axios instance (`api.js`) — `authService`, `eventService`, `registrationService`, `adminService`, `paymentService`, `notificationService`.
- **Pages** (`src/pages/`): route-level views (Home, Events, EventDetails, Login, Register, StudentDashboard, AdminDashboard, Certificates, CompletedEvents, EventResultPage, About, Contact, Profile) plus an `admin/` subfolder for all admin-only screens.
- **Components** (`src/components/`): `layout/` (Navbar, Footer, Sidebar, AIChatbot), `ui/` (reusable design-system pieces: GlassCard, GradientButton, Modal, Badge, StatusBadge, StatsCard, CountdownTimer, QRDownload, etc.), `payment/` (Razorpay + mock payment), `registration/` (RegistrationModal), `three/` (3D hero scene assets), `shared/` (ConfirmDialog, EmptyState, LoadingScreen, PageTransition).
- **Utils** (`src/utils/`): `certificateGenerator.js` (client-side PDF certificate rendering with jsPDF), `constants.js`, `helpers.js`, `validators.js`.
- `axios` interceptor (`services/api.js`) auto-attaches the JWT bearer token and force-logs-out the user on a `401` response.

## 10. Backend Technology and Architecture

**Location:** `backend/`

| Layer | Technology (from `backend/package.json`) |
|---|---|
| Runtime | Node.js |
| Framework | Express `4.19.2` |
| Database ODM | Mongoose `8.4.1` (MongoDB) |
| Auth | `jsonwebtoken` `9.0.2`, `bcryptjs` `2.4.3` |
| Google OAuth | `google-auth-library` `10.9.0` |
| Email | `nodemailer` `6.9.13` |
| File uploads | `multer` `1.4.5-lts.1` (memory storage) |
| Image storage | `cloudinary` `2.2.0` |
| Image processing / OCR | `jimp` `1.6.1`, `tesseract.js` `7.0.0` |
| QR generation | `qrcode` `1.5.3` |
| Payments | `razorpay` `2.9.2` |
| IDs | `uuid` `9.0.1` |
| Dev DB fallback | `mongodb-memory-server` `11.2.0` |
| Dev server | `nodemon` `3.1.2` |

**Architecture** — classic layered Express REST API:

```
server.js  →  routes/*.js  →  controllers/*.js  →  models/*.js (Mongoose)
                   │
              middleware/ (auth, admin, upload)
```

- `server.js` loads environment variables, connects to MongoDB, mounts all routers under `/api/*`, and starts a `setInterval` (every 60s) that runs `updateEventStatuses()` to auto-transition event lifecycle status.
- `config/db.js` connects to `MONGO_URI`; if the connection fails it **automatically falls back to an in-memory MongoDB instance** (`mongodb-memory-server`) and seeds demo admin/student/event/registration data — convenient for local development/demos without a real database.
- `config/cloudinary.js` configures the Cloudinary SDK for image storage.
- Controllers contain all business logic (validation, seat/venue conflict checks, cascading deletes, etc.) and talk directly to Mongoose models.
- `utils/eventStatusHelper.js` contains the IST-timezone-correct date/time parsing and the background event-status updater.
- `utils/sendEmail.js` wraps Nodemailer (Gmail SMTP) and contains all HTML email templates (OTP, admin approval/rejection, admin request notification).

## 11. Middleware

| Middleware | File | Purpose |
|---|---|---|
| `protect` (alias `auth`) | `middleware/auth.js` | Verifies the `Authorization: Bearer <token>` JWT and attaches `req.user = { id, role, type }`. Rejects with `401` if missing/invalid. |
| `adminOnly` | `middleware/admin.js` | Allows only `role === 'admin'` or `role === 'super_admin'`. Returns `403` otherwise. |
| `superAdminOnly` | `middleware/admin.js` | Allows only `role === 'super_admin'`. Returns `403` otherwise. |
| `upload` | `middleware/upload.js` | Multer memory-storage config; accepts only `image/*` MIME types, 5 MB size limit (used for ID-card OCR upload). |
| `cors()` | `server.js` | Enables cross-origin requests from the frontend. |
| `express.json()` | `server.js` | Parses JSON request bodies. |

## 12. Database Technology and Complete Database Models/Collections

**Database:** MongoDB, accessed via **Mongoose** ODM.

| Model / Collection | Purpose | Key Fields |
|---|---|---|
| `Admin` | Admin & super admin accounts | `name, email, password (hashed), role (admin/super_admin), verified, otp, otpExpiry, approvalStatus (pending/approved/rejected), isActive, approvedBy, approvedAt` |
| `StudentInternal` | Verified internal (in-college) students | `name, registerNumber (unique), department, year, phone, email (unique), gender, password (hashed), profilePhoto, verified, otp, otpExpiry, googleId, profilePicture, lastLoginTime` |
| `StudentExternal` | Students from other colleges | `name, collegeName, idCardUrl, department (enum), year, phone, email (unique), gender, password (hashed, select:false), verified, otp, otpExpiry, registeredEvents[], bookmarks[]` |
| `PendingRegistration` | Temporary holding record until OTP is verified | `email (unique), type, userData (object), otp, otpExpiry`; **TTL index — auto-deletes after 15 minutes** |
| `CollegeStudent` | Master pre-verification list of legitimate college students (used to validate internal sign-ups) | `studentId (unique), name, collegeName, department, batch, validUntil, qrVerificationCode (unique), isDisabled, isRegistered, registeredUserId` |
| `Event` | Event details | `title, description, poster, category (enum), date, startTime, endTime, venue, internalPrice, externalPrice, seatLimit, registeredCount, schedule[], rules[], prizes[], coordinators[], brochureUrl, organizer, isActive, status (upcoming/ongoing/completed), registrationOpen, registrationClosedAt, isFeatured, isTrending, lastDate, requiresApproval, firstPrize, secondPrize, thirdPrize` |
| `Registration` | A student's (or team's) registration for an event | `studentId, studentType (refPath), eventId, fullName, usn, collegeName, department, yearSemester, email, phone, foodPreference, registrationType (individual/team), teamSize, teamName, teamMembers[], status (pending/approved/rejected), paymentStatus, attendanceStatus, certificateStatus, certificateNumber, qrCode, secureToken (unique), qrData` |
| `Payment` | Razorpay payment records | `registrationId, studentId, studentType, eventId, amount, transactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature, status (pending/completed/failed), method, paidAt` |
| `Attendance` | Per-student, per-event attendance record | `registrationId, studentId, studentType, eventId, status (present/absent), scannedBy, scannedAt`; **unique index on `(studentId, eventId)`** |
| `Certificate` | Issued certificate records | `studentId, studentType, eventId, registrationId, certificateNumber (unique), certificateUrl, verificationCode (unique), status (pending/approved/issued), approvedBy, approvedAt, issuedAt` |
| `EventResult` | (Defined model for per-participant results; see note below) | `eventId, participantId, position (1/2/3), prizeAmount, remarks, publishedAt, createdBy`; unique indexes on `(eventId, position)` and `(eventId, participantId)` |
| `Notification` | Per-user notifications | `userId, userType (refPath: Admin/StudentInternal/StudentExternal), title, message, type (registration/payment/event/certificate/announcement), isRead` |
| `DeletionRequest` | Student account-deletion requests | `studentId, studentModel, name, email, usn, reason, status (pending/approved/denied), adminNote, resolvedAt` |
| `Feedback` | Event feedback (rating + comment) | `studentId, studentType, eventId, rating (1–5), comment`; unique index on `(studentId, eventId)` — **model exists but currently has no controller/route wired to it in the codebase (not exposed via the API).** |

> **Note:** Winner/prize data is actually stored **embedded directly on the `Event` document** (`firstPrize`, `secondPrize`, `thirdPrize` sub-objects) and served through `resultController.js`. The separate `EventResult` model is defined in `models/EventResult.js` but is **not currently used by any controller** — `resultController.js` operates on the embedded `Event` prize fields instead.

## 13. API Routes and Important Endpoints

All routes are mounted in `server.js` under `/api`:

```
/api/auth              → routes/authRoutes.js
/api/events             → routes/eventRoutes.js
/api/registrations      → routes/registrationRoutes.js
/api/admin              → routes/adminRoutes.js
/api/payments            → routes/paymentRoutes.js
/api/attendance          → routes/attendanceRoutes.js
/api/certificates        → routes/certificateRoutes.js
/api/notifications        → routes/notificationRoutes.js
/api/deletion-requests    → routes/deletionRoutes.js
```

See [Section 36 – API Documentation](#36-api-documentation) for the full endpoint table.

## 14. Authentication & Authorization

- **Password hashing:** `bcryptjs` (`Admin`/`StudentInternal` use 10 salt rounds via `pre('save')` hooks; `StudentExternal` uses 12 rounds).
- **JWT:** signed with `process.env.JWT_SECRET` (falls back to a hardcoded default if unset — **should always be overridden in production**), payload `{ id, role, type }`, expires in **30 days**.
- **`protect` middleware** validates the bearer token on every private route and populates `req.user`.
- **Role gates:** `adminOnly` / `superAdminOnly` middleware (see [Section 11](#11-middleware)).
- **Domain-restricted login:** internal students must authenticate with an `@shanmugha.edu.in` email; Google login is restricted to `@shanmugha.edu.in` (or `@gmail.com` for testing).
- **Admin approval gate:** new admin accounts cannot log in until `approvalStatus === 'approved'` and `isActive === true` (checked explicitly in `loginUser`).
- **Google OAuth:** verifies the Google ID token via `google-auth-library`; falls back to a manual JWT payload decode if strict verification fails (useful for local testing without a real Google Client ID configured).

## 15. Email & OTP Verification

- OTPs are **6-digit random numbers**, **bcrypt-hashed** before being stored, and expire after **5 minutes**.
- Registration data is held in the `PendingRegistration` collection (which itself auto-expires after **15 minutes** via a MongoDB TTL index) until the OTP is verified — the real user account is only created at that point.
- `resendOTP` regenerates and re-emails a fresh OTP for an existing pending registration.
- Emails are sent via **Nodemailer** through Gmail SMTP (`smtp.gmail.com:587`), using `EMAIL_USER` / `EMAIL_PASS` (Gmail App Password) from environment variables.
- HTML email templates implemented in `utils/sendEmail.js`: OTP verification, new-admin-request notification (to the super admin), admin-approval confirmation, admin-rejection notice.

## 16. QR Code Functionality

- Every registration gets a **`secureToken`** (UUID) and a **`qrData`** field containing `{ registrationId, token }` as a JSON string.
- **Frontend:** `qrcode.react` renders the QR code for the student to view/download (`QRDownload.jsx`, PNG via `html2canvas` or embedded in a PDF via `jsPDF`).
- **Admin scanning:** `QRScanner.jsx` uses `html5-qrcode` to scan the code via the device camera, parses the JSON payload, and calls `POST /api/attendance/scan` with `registrationId` and `token`.
- **Backend verification:** `attendanceController.scanQR` looks up the registration, verifies the token matches `secureToken` (prevents forged/tampered QR codes), checks payment status, and prevents double-marking attendance.

## 17. Event Creation & Management

Admins create events (`CreateEvent.jsx` → `POST /api/events`) with:

- Title, description, poster image URL, category (`Tech, Non-Tech, Workshop, Hackathon, Sports, Seminar, Cultural`)
- Date, start time, end time, venue
- Internal price / external price (separate pricing tiers) and seat limit
- Optional: schedule items, rules list, prize list, coordinators (name/phone/role), brochure URL, organizer name, featured/trending flags

Full CRUD is available: `GET /api/events`, `GET /api/events/:id`, `PUT /api/events/:id`, `DELETE /api/events/:id` (admin-only for write operations). Deleting an event **cascades** — it also deletes all related `Registration`, `Payment`, `Certificate`, and `Attendance` documents for that event.

## 18. Date, Time and Venue Conflict Prevention

Two layers of protection prevent double-booking a venue:

1. **Application-level overlap check** (`eventController.createEvent` / `updateEvent`): before saving, the server queries for any existing event at the same `venue` and `date` whose time range overlaps (`existingStart < newEnd AND existingEnd > newStart`). If found, it returns `409 Conflict` with the conflicting slot and event name.
2. **Database-level uniqueness** (`Event` schema): `eventSchema.index({ venue: 1, date: 1, startTime: 1 }, { unique: true })` — a hard backstop against duplicate venue/date/start-time combinations even under race conditions.

There is also a **`getVenueBookings`** endpoint (`GET /api/events/booked-slots`) that returns a fixed grid of 8 hourly slots (09:00–17:00) for a given venue/date, marking each as available or booked — this powers a visual availability picker in the admin "Create Event" UI.

## 19. Seat Capacity & Registration Control

- Every `Event` tracks `seatLimit` and `registeredCount`.
- Before accepting a registration, the server checks: registration is open (`registrationOpen`), the event hasn't started/completed (using IST-corrected date/time comparison), and there is enough remaining capacity for the requested seats (1 for individual, 2–4 for a team).
- **Atomic increments** are used via `Event.findOneAndUpdate({ _id, registeredCount: { $lte: seatLimit - increment } }, { $inc: { registeredCount: increment } })` — this prevents two concurrent requests from both succeeding and overselling seats. If the atomic condition fails (seats filled in between), the just-created registration is rolled back and the student is told the event just filled up.
- When `registeredCount` reaches `seatLimit`, the event's `registrationOpen` flag is automatically set to `false` and `registrationClosedAt` is stamped.
- Admins can also manually toggle registration open/closed via `PATCH /api/events/:id/registration-status`.
- Deleting or rejecting an approved registration decrements the seat count and can automatically **reopen** registration if seats become available again.

## 20. Payment Functionality

Payments **are implemented** using **Razorpay** (`backend/controllers/paymentController.js`, `frontend/src/components/payment/RazorpayCheckout.js`):

- `POST /api/payments/create-order` creates a Razorpay order (amount in paise) and a `pending` `Payment` record.
- `POST /api/payments/verify` verifies the payment signature (`HMAC-SHA256` using `RAZORPAY_KEY_SECRET`) and, on success, creates the actual `Registration` (with `paymentStatus: 'completed'`, `status: 'approved'`), updates the `Payment` record, and atomically increments the event's `registeredCount`.
- `GET /api/payments/history` — student's own payment history.
- `GET /api/payments/all` — admin view of all payments.
- **Built-in mock/test mode:** if `RAZORPAY_KEY_ID` is unset, is the literal placeholder `rzp_test_placeholder`, or contains `xxx`, the backend **bypasses real Razorpay** and generates a mock order; the frontend correspondingly skips the real Razorpay checkout widget and auto-completes a simulated payment after a short delay (`MockPaymentModal.jsx` / `isMock` flag) — useful for demos/local development without live payment credentials.
- Pricing is tiered: `internalPrice` vs `externalPrice` on each `Event`, multiplied by team size for team registrations.
- A UPI QR image asset (`frontend/public/upi_qr.png`) is also present in the frontend's public assets.

## 21. Event Status & Completed Event Workflow

- `utils/eventStatusHelper.js` computes each event's real-time status using **IST (UTC+5:30)-correct date/time arithmetic** (explicitly built to avoid a server-timezone bug — documented in the code comments and in `task.md`).
- Status transitions:
  - `now < startDateTime` → `upcoming`
  - `startDateTime ≤ now < endDateTime` → `ongoing`
  - `now ≥ endDateTime` → `completed`
- This runs automatically: (a) on **every** `GET /api/events` or `GET /api/events/:id` call, and (b) via a **60-second background interval** started in `server.js`.
- When an event transitions to `ongoing` or `completed`, `registrationOpen` is automatically forced to `false`.
- `GET /api/events/completed` returns all completed events, flagged with `hasResults` (true if a `firstPrize.winnerName` has been published).
- The frontend `CompletedEvents.jsx` page also polls every 60 seconds (per `task.md`) to keep event status current without a manual page refresh.

## 22. Attendance Functionality

- `POST /api/attendance/scan` (admin-only): validates the scanned QR payload against the registration's `secureToken`, rejects if payment isn't completed/not-required, and rejects duplicate scans.
- On success: sets `Registration.attendanceStatus = 'present'`, sets `certificateStatus = 'generated'`, auto-generates a `certificateNumber` if missing, creates a `Certificate` document, sends 3 notifications to the student (attendance verified, certificate generated, certificate ready to download), and upserts an `Attendance` document.
- `GET /api/attendance/event/:eventId` (admin-only): lists attendance for a given event, populated with student and scanning-admin details.
- The `Attendance` model enforces **one record per student per event** via a unique compound index.

## 23. Results & Winner Management

- Admins publish results through `POST /api/events/:id/results` (`resultController.addEventResult`), submitting `firstPrize`, `secondPrize`, and `thirdPrize` objects — all three are required together.
- Results are stored **embedded on the `Event` document itself**, not in a separate collection.
- `GET /api/events/:id/full-details` (`getEventFullDetails`, public) returns the event plus a `winners` object (populated only if a `firstPrize.winnerName` exists) for the public results page (`EventResultPage.jsx`).
- `DELETE /api/events/:id/results/:resultId` (`deleteEventResult`) clears all three prize fields from the event (the `:resultId` param is accepted for REST-style consistency but the handler simply unsets the embedded prize fields on the event).

## 24. Prize Management (1st / 2nd / 3rd)

Each of `firstPrize`, `secondPrize`, and `thirdPrize` on the `Event` schema is a sub-document with:

```js
{
  winnerName: String,
  collegeName: String,
  department: String,
  year: String,
  prizeType: String,
  cashAmount: Number,   // default 0
  photoUrl: String
}
```

This lets an admin record the winner's name, college/department/year, the type of prize (e.g. trophy/cash/certificate), a cash amount, and an optional photo — all managed from the **Results Management** admin screen (`ResultsManagement.jsx`) and displayed publicly on the **Event Result** page and the **Completed Events** listing (via a `WinnerCard` UI component).

## 25. Certificate Functionality

Certificates **are implemented**, combining server-side tracking with client-side PDF rendering:

- **Eligibility:** `GET /api/certificates/eligible/:eventId` lists registrations that have completed payment (or didn't need to) for a given event (or all events).
- **Approval/Release:**
  - `POST /api/certificates/approve/:registrationId` — releases a single certificate, creates the `Certificate` record, sets `Registration.certificateStatus = 'released'`, and notifies the student with their certificate number.
  - `POST /api/certificates/bulk-approve/:eventId` — releases certificates in bulk for all eligible (present + paid/free, not already released) registrations for an event, generating unique certificate numbers and notifications for each.
- **Certificate numbering:** either the sequential `CERT-YYYY-000001` format (`Registration.generateCertificateNumber`) or the `CEH-YYYY-XXXX` random format used by the certificate controller helpers — both are present in the codebase.
- **Student access:** `GET /api/certificates/my` returns only certificates with `status: 'approved'` for the logged-in student (pending certificates are hidden from students until released).
- **Public verification:** `GET /api/certificates/verify/:code` (no auth) looks up a certificate by its `verificationCode` **or** `certificateNumber` (case-insensitive).
- **PDF rendering:** `frontend/src/utils/certificateGenerator.js` builds a styled landscape A4 certificate **client-side** using `jsPDF` (navy/gold color scheme, corner ornaments, embedded verification QR code via the `qrcode` library) — no server-side certificate image/PDF storage is used; Cloudinary is configured in `backend/config/cloudinary.js` but certificates are generated on-demand in the browser rather than uploaded there.

## 26. Notifications

Notifications **are implemented** as an in-app system (no push/SMS integration):

- `Notification` model stores per-user notifications with a `type` (`registration | payment | event | certificate | announcement`) and `isRead` flag.
- Automatically created by the system when: attendance is marked, a certificate is released, or an admin sends an announcement.
- `GET /api/notifications` — the last 50 notifications for the logged-in user.
- `PUT /api/notifications/:id/read` — mark a notification as read.
- `POST /api/notifications/announcement` (admin-only) — bulk-creates a notification for every student in the selected target group (`all`, `internal`, or `external`).

## 27. Security Features

- **Password hashing** with `bcryptjs` for all account types (never stored in plaintext).
- **OTP hashing** — OTPs are bcrypt-hashed before storage, never stored or logged in plaintext to the database (though the *plain* OTP is currently logged to the server console for debugging — see [Future Enhancements](#38-future-enhancements)).
- **JWT authentication** on all private endpoints via the `protect` middleware.
- **Role-based access control** via `adminOnly` / `superAdminOnly` middleware.
- **QR token verification** — attendance scanning cross-checks the scanned token against the registration's stored `secureToken` to reject forged/tampered QR codes.
- **Domain-restricted institutional login** for internal students and Google OAuth.
- **ID-card authenticity check** — a custom pixel-region hologram detector (`verifyHologram`) runs on the uploaded ID card image before OCR is attempted, rejecting images that don't show the expected silver holographic pattern.
- **Razorpay signature verification** (HMAC-SHA256) to prevent payment forgery in production mode.
- **File upload restrictions** — Multer `fileFilter` only accepts image MIME types, 5 MB max size.
- **Admin approval gate** — new admin accounts cannot access the system until explicitly approved by a Super Admin.
- **Cascading deletes** on event/account removal to avoid orphaned sensitive records.
- **Environment-based secrets** — JWT secret, DB URI, email credentials, payment keys, and Cloudinary keys are all loaded from environment variables (`dotenv`), never hardcoded (aside from documented local-dev fallbacks).

## 28. Validation Mechanisms

- **Mongoose schema validation**: `required`, `enum`, `min`/`max`, `minlength`, regex `match` (e.g. email format), and custom error messages defined directly on each model (see [Section 12](#12-database-technology-and-complete-database-modelscollections)).
- **Unique indexes** enforced at the database level for emails, register numbers, QR verification codes, certificate numbers, venue/date/time combinations, and one-registration-per-student-per-event.
- **Controller-level business validation**: team size bounds (2–4), required team-member fields, seat-availability checks, registration-window checks (event not started/completed), duplicate-registration checks, duplicate-attendance checks, already-released-certificate checks.
- **Frontend validation**: `react-hook-form` for form-level validation plus a dedicated `frontend/src/utils/validators.js` helper module.
- **Duplicate-key error handling**: MongoDB `E11000` duplicate key errors are explicitly caught and converted into friendly `409`/`400` JSON responses (e.g. venue double-booking, duplicate registration).

---

## 29. Complete Project Folder Structure

```
event_project/
├── frontend/                    # Frontend React Application
│   ├── public/                  # Static assets & public resources
│   ├── src/
│   │   ├── components/          # Reusable UI components & dialogs
│   │   │   ├── admin/           # Admin-specific components & tables
│   │   │   └── ui/              # Buttons, cards, and 3D visual elements
│   │   ├── context/             # React Context (AuthContext, etc.)
│   │   ├── pages/               # Application pages/views
│   │   │   ├── admin/           # Admin pages (CreateEvent, QRScanner, CertificateManagement)
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── Register.jsx     # Event registration page
│   │   │   ├── Certificates.jsx # Certificate view & download page
│   │   │   └── StudentDashboard.jsx # Student portal page
│   │   ├── services/            # API client services (authService, adminService)
│   │   ├── utils/               # Helper utilities & PDF generators
│   │   ├── App.jsx              # Main React route configuration
│   │   └── main.jsx             # React entry point
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
│
├── backend/                     # Backend Express REST API
│   ├── config/                  # Database connection configuration (db.js)
│   ├── controllers/             # Business logic controllers
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── certificateController.js
│   │   ├── paymentController.js
│   │   └── registrationController.js
│   ├── models/                  # Mongoose Schema Models
│   │   ├── Attendance.js
│   │   ├── Certificate.js
│   │   ├── CertificateTemplate.js
│   │   ├── CollegeStudent.js
│   │   ├── Counter.js
│   │   ├── Event.js
│   │   ├── Participant.js
│   │   └── Registration.js
│   ├── routes/                  # Express Router endpoints
│   │   ├── attendanceRoutes.js
│   │   ├── authRoutes.js
│   │   ├── certificateRoutes.js
│   │   ├── internalRoutes.js
│   │   └── internalStudentRoutes.js
│   ├── utils/                   # Helper functions & test suites
│   ├── package.json             # Backend dependencies
│   └── server.js                # Server entry point
│
├── .gitignore                   # Root git ignore definitions
└── README.md                    # Project documentation
```

### Folder Purpose Summary
* `frontend/`: Contains all client-side source code, components, state hooks, and styling assets.
* `frontend/src/pages/`: Top-level page views rendered via React Router.
* `frontend/src/services/`: Modular HTTP layer communicating with the Express backend.
* `backend/controllers/`: Express request handlers encapsulating core business rules.
* `backend/models/`: Database schema definitions ensuring data consistency in MongoDB.
* `backend/routes/`: Declarative HTTP REST API endpoint definitions.

---

## Installation & Setup

### Prerequisites
* **Node.js**: v18.x or higher
* **npm**: v9.x or higher
* **MongoDB**: Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file inside the `backend/` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event_management
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

---

## API Overview

### Authentication
* `POST /api/auth/register` - User registration
* `POST /api/auth/login` - User authentication & JWT issuance
* `POST /api/auth/verify-otp` - OTP validation

### Events
* `GET /api/events` - Fetch all active events
* `POST /api/events` - Create a new event (Admin)
* `GET /api/events/:id` - Fetch event details
* `PUT /api/events/:id` - Update event details (Admin)

### Attendance
* `POST /api/attendance/scan-barcode` - Record attendance via barcode (Internal)
* `POST /api/attendance/scan-qr` - Record attendance via QR code (External)
* `GET /api/attendance/event/:eventId` - Retrieve event attendance log

### Certificates
* `POST /api/certificates/templates` - Upload certificate template
* `GET /api/certificates/template/:eventId` - Fetch certificate template for event
* `POST /api/certificates/generate` - Generate PDF certificate

### Users & Admin
* `GET /api/admin/dashboard` - Retrieve overall analytics
* `GET /api/admin/students` - Manage registered student profiles

---

## Database Collections

* **Users**: System user accounts (Admins, Coordinators).
* **Events**: Event definitions, dates, venues, capacities, and metadata.
* **Registrations**: Event registration entries linking students to events.
* **Attendance**: Real-time logs of scanned barcodes/QR codes with timestamps.
* **Certificates**: Issued certificate records and unique verification hashes.
* **CertificateTemplates**: Templates with coordinate mapping for dynamic text placeholders.

---

## Attendance Workflow

### Internal Students
```
[ Campus ID / Barcode Scan ] ──► [ Instant Verification ] ──► [ Attendance Logged ] ──► [ Certificate Unlocked ]
```

### External Students
```
[ Digital Ticket QR Scan ] ──► [ Security Token Check ] ──► [ Attendance Logged ] ──► [ Certificate Unlocked ]
```

---

## Certificate Workflow

```
[ Upload Template (PNG/JPG/PDF) ] ──► [ Drag & Drop Placeholders ] ──► [ Save Event Template ]
                                                                             │
[ Download PDF Certificate ] ◄── [ Auto Generate Certificate ] ◄──────────────┘
```

---

## Screenshots

*(Placeholder section - screenshots will be rendered here once uploaded)*

* **Home Landing Page**: `![Home](docs/screenshots/home.png)`
* **Admin Dashboard**: `![Admin Dashboard](docs/screenshots/admin_dashboard.png)`
* **Student Dashboard**: `![Student Dashboard](docs/screenshots/student_dashboard.png)`
* **Attendance Scanner**: `![Attendance](docs/screenshots/attendance.png)`
* **Certificate Editor**: `![Certificate Editor](docs/screenshots/certificate_editor.png)`
* **Certificate Download**: `![Certificate Download](docs/screenshots/certificate_download.png)`

---

## Future Enhancements

* **Mobile App**: React Native cross-platform app for quick offline barcode/QR scanning.
* **Live Notifications**: WebSocket / Push notifications for instant event alerts and schedule changes.
* **Digital Signature**: Cryptographic digital signatures on generated certificates.
* **Public Certificate Verification Portal**: Publicly accessible verification link for third-party validation.
* **Analytics Dashboard**: Advanced data visualizer for participant demographics and institution feedback.

---

## Contributors

* **Gokulnath3825**
* **Sanjay-vinayagamoorthy1967**

---

## License

This project is licensed under the [MIT License](LICENSE).
