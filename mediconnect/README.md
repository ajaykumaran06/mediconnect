# MediConnect — Rural Health Access Platform

> Quality healthcare, wherever you are. Built for patients in underserved regions.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Overview

MediConnect is a full-stack telehealth platform that connects rural patients with verified doctors. Patients can book appointments, track prescriptions, upload medical reports, and use an AI-powered symptom checker to find the right specialist.

### User Roles

| Role    | Capabilities                                                 |
|---------|--------------------------------------------------------------|
| Patient | Book appointments, view prescriptions, upload reports, symptom checker |
| Doctor  | Manage appointments, write prescriptions, view patient history |
| Admin   | Approve doctor accounts, manage users, view analytics        |

---

## Tech Stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Frontend  | React 18, React Router 6, Tailwind CSS |
| State     | Zustand (auth), TanStack Query (data)  |
| Backend   | Node.js, Express                      |
| Database  | PostgreSQL via Supabase                |
| Auth      | JWT (jsonwebtoken + bcryptjs)         |
| File Store| Supabase Storage                      |
| PDF Gen   | pdf-lib                               |
| Email     | Resend                                |
| Deploy    | Docker + nginx                        |

---

## Project Structure

```
mediconnect/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client (service key)
│   ├── database/
│   │   └── schema.sql           # Full PostgreSQL schema + RLS policies
│   ├── middleware/
│   │   ├── auth.js              # JWT verify + role-based authorize()
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   ├── auth.js              # Signup, login, /me, logout
│   │   ├── doctors.js           # Doctor listing, profile, appointments
│   │   ├── appointments.js      # Book, list, update status, delete
│   │   ├── prescriptions.js     # Create, list, PDF download
│   │   ├── symptoms.js          # Symptom → specialist checker
│   │   ├── admin.js             # Approve doctors, manage users, analytics
│   │   └── upload.js            # File upload to Supabase Storage
│   ├── services/
│   │   └── emailService.js      # Resend email notifications
│   ├── server.js                # Express app entry point
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Sticky nav with role-aware menu
│   │   │   └── ui.jsx           # Reusable: LoadingSpinner, EmptyState, etc.
│   │   ├── hooks/
│   │   │   └── useApi.js        # All TanStack Query hooks (doctors, appointments, etc.)
│   │   ├── lib/
│   │   │   ├── api.js           # Axios instance with JWT interceptor
│   │   │   └── i18n.js          # i18next setup (EN, HI, TA, TE)
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.jsx         # Hero, search, features, testimonials
│   │   │   │   ├── LoginPage.jsx        # Login form
│   │   │   │   ├── SignupPage.jsx       # Patient signup
│   │   │   │   └── DoctorSignupPage.jsx # Doctor signup (pending approval)
│   │   │   ├── patient/
│   │   │   │   ├── PatientDashboard.jsx    # Overview with upcoming appts
│   │   │   │   ├── BookAppointmentPage.jsx # Search + filter + slot selection
│   │   │   │   ├── MedicalHistoryPage.jsx  # Past consultations + file upload
│   │   │   │   ├── PrescriptionsPage.jsx   # View + PDF download
│   │   │   │   └── SymptomCheckerPage.jsx  # AI symptom → specialist
│   │   │   ├── doctor/
│   │   │   │   ├── DoctorDashboard.jsx         # Today's queue + stats
│   │   │   │   ├── AppointmentManagementPage.jsx # Full appointment CRUD
│   │   │   │   ├── CreatePrescriptionPage.jsx    # Write prescriptions
│   │   │   │   └── PatientHistoryPage.jsx        # Patient's rx history
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx  # Analytics + pending approvals
│   │   │       ├── AdminUsersPage.jsx  # User table + delete
│   │   │       └── AdminDoctorsPage.jsx # Doctor approval/rejection
│   │   ├── store/
│   │   │   └── authStore.js     # Zustand store for auth state
│   │   ├── App.jsx              # Router + protected routes
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Tailwind + global styles + fonts
│   ├── package.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
└── README.md
```

---

## Features

### ✅ Must Have (Implemented)
- JWT auth with role-based access (patient / doctor / admin)
- Doctor listing with search + specialization filter
- Appointment booking with slot selection and conflict prevention
- Doctor dashboard with patient queue and status management
- Prescription creation (multi-medicine) with PDF generation (pdf-lib)
- Patient history view for doctors
- Admin approval workflow for doctor accounts
- Medical records file upload (Supabase Storage)
- Patient prescriptions with PDF download

### 🌟 Nice to Have (Implemented)
- Multilingual support — EN, Hindi, Tamil, Telugu (i18next)
- Symptom checker — maps symptoms to specialists with urgency levels
- Email notifications via Resend (appointment confirmation, doctor approval)
- Dockerized deployment with nginx

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) [Resend](https://resend.com) account for email

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Fill in your Supabase and JWT values in .env

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Fill in REACT_APP_API_URL
```

### 2. Set up the database

1. Go to your Supabase project → SQL Editor
2. Copy and run the contents of `backend/database/schema.sql`
3. Create a storage bucket named `medical-files` and set it to public

### 3. Create an admin user

```sql
-- Run in Supabase SQL Editor after bcrypt hashing your password
-- Use: node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword', 12))"
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@mediconnect.health', '<bcrypt_hash>', 'admin');
```

### 4. Run in development

```bash
# Terminal 1 — backend
cd backend
npm run dev   # runs on http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm start     # runs on http://localhost:3000
```

### 5. Run with Docker

```bash
docker-compose up --build
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `PORT`                | Server port (default: 5000)         |
| `JWT_SECRET`          | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN`      | Token expiry (e.g. `7d`)            |
| `SUPABASE_URL`        | Your Supabase project URL           |
| `SUPABASE_ANON_KEY`   | Supabase anon key                   |
| `SUPABASE_SERVICE_KEY`| Supabase service role key (bypasses RLS) |
| `RESEND_API_KEY`      | Resend API key (optional)           |
| `EMAIL_FROM`          | Sender email address                |

### Frontend (`frontend/.env`)

| Variable                   | Description              |
|----------------------------|--------------------------|
| `REACT_APP_API_URL`        | Backend API base URL     |
| `REACT_APP_SUPABASE_URL`   | Supabase URL (if needed) |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon key     |

---

## API Reference

### Auth
| Method | Endpoint                | Auth | Description           |
|--------|-------------------------|------|-----------------------|
| POST   | `/api/auth/signup`      | —    | Patient registration  |
| POST   | `/api/auth/signup/doctor`| —   | Doctor registration   |
| POST   | `/api/auth/login`       | —    | Login (all roles)     |
| GET    | `/api/auth/me`          | JWT  | Get current user      |
| POST   | `/api/auth/logout`      | JWT  | Logout                |

### Doctors
| Method | Endpoint                          | Auth  | Description              |
|--------|-----------------------------------|-------|--------------------------|
| GET    | `/api/doctors`                    | —     | List approved doctors    |
| GET    | `/api/doctors/:id`                | —     | Doctor detail            |
| PUT    | `/api/doctors/profile`            | Doctor| Update own profile       |
| GET    | `/api/doctors/appointments/me`    | Doctor| Doctor's appointments    |
| GET    | `/api/doctors/meta/specializations`| —    | All specializations      |

### Appointments
| Method | Endpoint                          | Auth         | Description        |
|--------|-----------------------------------|--------------|--------------------|
| POST   | `/api/appointments`               | Patient      | Book appointment   |
| GET    | `/api/appointments/user`          | Patient      | Patient's bookings |
| GET    | `/api/appointments/doctor`        | Doctor       | Doctor's bookings  |
| PUT    | `/api/appointments/:id/status`    | Doctor/Patient| Update status     |
| DELETE | `/api/appointments/:id`           | Patient/Admin| Delete appointment |

### Prescriptions
| Method | Endpoint                          | Auth    | Description        |
|--------|-----------------------------------|---------|--------------------|
| POST   | `/api/prescriptions`              | Doctor  | Create prescription|
| GET    | `/api/prescriptions/:patientId`   | Auth    | Patient's rx list  |
| GET    | `/api/prescriptions/download/:id` | Auth    | Download PDF       |

### Symptoms
| Method | Endpoint              | Auth | Description             |
|--------|-----------------------|------|-------------------------|
| POST   | `/api/symptoms/check` | —    | Get specialist suggestion|

### Admin
| Method | Endpoint                           | Auth  | Description            |
|--------|------------------------------------|-------|------------------------|
| GET    | `/api/admin/doctors/pending`       | Admin | Pending approvals      |
| PUT    | `/api/admin/doctors/:id/approve`   | Admin | Approve/reject doctor  |
| GET    | `/api/admin/users`                 | Admin | All users              |
| DELETE | `/api/admin/users/:id`             | Admin | Remove user            |
| GET    | `/api/admin/analytics`             | Admin | Platform stats         |

---

## Deployment

### Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Run `schema.sql` in SQL Editor
3. Create `medical-files` storage bucket (public)
4. Copy API keys to `.env`

### Production (Docker)
```bash
docker-compose -f docker-compose.yml up -d --build
```

### Vercel (Frontend) + Railway/Render (Backend)
- Frontend: push `frontend/` to Vercel, set `REACT_APP_API_URL` env var
- Backend: push `backend/` to Railway or Render, set all env vars
