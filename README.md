# Hospital Web Platform — EPH N'Gaous

A trilingual (Arabic / French / English) web platform for the **Public Hospital Establishment of N'Gaous** (Wilaya of Batna, Algeria). Citizens browse the hospital's services, departments and doctors, contact the hospital and book appointments online. Doctors process their own requests in a personal portal, and the administrator manages every piece of public content from a secured back office.

> Built as part of a discovery internship at ENSIA (National School of Artificial Intelligence), 2026/2027.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Database](#database)
- [Roles and access](#roles-and-access)
- [Main API endpoints](#main-api-endpoints)
- [Multilingual support](#multilingual-support)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Features

### Public website (citizens — no account needed)

- Home page: hero carousel with the emergency call button, services slider, featured departments, doctors, schedules, hospital **Administration** section, news, about and contact (with map).
- **Departments** with a dedicated details page: banner, side card (beds, head of department), about text, key services and the department's doctors with their **live presence** ("available now") and attendance schedule.
- **Doctors** list with photo, grade, specialty, working days/hours and a real-time presence badge ("See more / See less" in groups of three).
- **Online appointment booking** tied to each doctor's real schedule: absent days are refused, only free 30-minute slots are offered, no double booking.
- **Contact form** with validation (Algerian phone numbers).
- News with image gallery.
- Arabic (RTL), French and English, light and dark theme, fully responsive.

### Doctor portal (`/doctor`)

- Sign-up with **e-mail verification code**, then **approval by the administrator**.
- *My appointments*: filter by status, confirm, reject or mark as done.
- Change password.
- A doctor only ever sees **their own** appointments.

### Administration panel (`/admin`)

- Dashboard.
- Hospital information (name, mission, vision, values, history, address, phones, hours, social links, images).
- Departments, including the **details-page editor** (three independent images, texts in 3 languages, head of department, key services).
- Services, doctors, news (with gallery).
- **Administration section** of the home page: title/subtitle, office images (slider), directors (photo, role badge, position, description, display order, visibility).
- Contact messages (read / archive).
- Doctor accounts: approve, disable, delete, generate a temporary password.
- The admin interface is translated into Arabic, French and English.

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15 (App Router), React, TypeScript, CSS (custom properties), Lucide icons |
| Backend | FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| Database | MySQL (PyMySQL) |
| Security | JWT (python-jose), Argon2/bcrypt (pwdlib), httpOnly cookies |
| E-mail | SMTP (`smtplib`) for verification codes |
| Tools | Git, Visual Studio Code |

---

## Project structure

```text
hospital_project/
├── backend/
│   ├── app/
│   │   ├── core/          # config, security (JWT, hashing), dependencies (role checks), rate limiter, mailer
│   │   ├── models/        # SQLAlchemy tables (user, content, operations, administration, department_detail)
│   │   ├── schemas/       # Pydantic request / response models
│   │   ├── routers/       # REST endpoints per module (auth, doctors, appointments, administration, ...)
│   │   └── main.py        # app, CORS, security headers, startup table creation
│   ├── migrations/        # optional SQL scripts (001_news_gallery, 002_administration, 003_department_details)
│   └── requirements.txt
└── frontend/
    ├── app/               # pages: home, departments/[slug], services, doctors, news, contact, login,
    │                      #        /doctor/*, /admin/*, /api (auth routes + proxy)
    ├── components/        # navbar, footer, HomeView, HomeAdministration, DepartmentDetailView, booking window, ...
    ├── lib/               # API clients (api.ts, adminApi.ts), i18n dictionaries, validation helpers
    └── context/           # authentication context
```

---

## Getting started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MySQL** 8 (or MariaDB 10.4+) — for example through XAMPP / phpMyAdmin

### 1. Database

Create an empty database (for example `hospital_db`) with the `utf8mb4` charset, or import the provided `hospital_db.sql` dump through phpMyAdmin.

### 2. Backend

```bash
cd backend
python -m venv .venv

# Linux / macOS
source .venv/bin/activate
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env          # then fill in the values (see Configuration)
uvicorn app.main:app --reload --port 8000
```

The API is now on <http://localhost:8000>. In development, interactive docs are available at `/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The site is now on <http://localhost:3000>.

### 4. Create the administrator account

Open the sign-up page and register an administrator using the value of `ADMIN_SIGNUP_CODE` from your `.env`. Then log in and open `/admin`.

---

## Configuration

### Backend (`backend/.env`) — never commit this file

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql+pymysql://user:password@localhost:3306/hospital_db` |
| `JWT_SECRET_KEY` | Secret used to sign tokens (32+ random characters in production) |
| `ENVIRONMENT` | `development` or `production` (production enables strict start-up checks) |
| `CORS_ORIGINS` | Allowed website addresses, e.g. `http://localhost:3000` |
| `ADMIN_SIGNUP_CODE` | Secret code required to create an administrator account |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | E-mail account used to send verification codes |

### Frontend (`frontend/.env.local`)

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend, e.g. `http://localhost:8000` (used for API calls and uploaded images) |

---

## Database

- Tables are declared as SQLAlchemy models and **created automatically at start-up**. Small start-up migrations add newer columns to an existing database without losing data.
- The tables of the **Administration section** (`administration_settings`, `administration_offices`, `administration_directors`) and of the **department details page** (`department_details`) are also created automatically.
- Optional SQL scripts are in `backend/migrations/`:
  - `001_news_gallery.sql` — gallery column for news
  - `002_administration.sql` — Administration section tables **plus starter content** (4 directors, 3 offices)
  - `003_department_details.sql` — department details table

### Main tables

| Table | Content |
|---|---|
| `users` | Admin and doctor accounts (hashed password, role, approval, e-mail verification) |
| `doctors` | Public doctor profile in 3 languages, specialty, grade, schedule, department |
| `departments`, `department_details` | Departments and the editable content of their details page |
| `services` | Offered services |
| `appointments` | Booking requests with status `pending → confirmed → completed` (or `rejected`) |
| `contact_messages` | Messages from the contact form |
| `hospital_info` | Single row with all editable hospital information |
| `news` | Articles with gallery |
| `administration_*` | Administration section: settings, offices, directors |

Dynamic content is stored in three columns (`*_ar`, `*_fr`, `*_en`); the site falls back to Arabic when a translation is missing.

---

## Roles and access

| Capability | Citizen | Doctor | Admin |
|---|:--:|:--:|:--:|
| Browse hospital information, departments, services, news | ✅ | ✅ | ✅ |
| Send a contact message | ✅ | ✅ | ✅ |
| Book an appointment (doctor must have an account) | ✅ | — | — |
| Process own appointments | — | ✅ | — |
| Change own password | — | ✅ | — |
| Edit all website content | — | — | ✅ |
| Read / archive contact messages | — | — | ✅ |
| Approve / disable / delete doctor accounts | — | — | ✅ |
| View all appointments | — | — | ✅ |

### Doctor account creation

1. Sign-up form (profile, e-mail, password)
2. 6-digit code e-mailed (valid 15 minutes, max 5 attempts)
3. Code entered → e-mail verified
4. Administrator approves the account
5. Doctor logs in and receives appointments

Unverified accounts older than 30 minutes are deleted automatically.

---

## Main API endpoints

| Method | Route | Purpose | Access |
|---|---|---|---|
| GET | `/api/doctors` | List active doctors | Public |
| GET | `/api/doctors/{id}/availability` | Free slots of a doctor on a date | Public |
| POST | `/api/appointments` | Submit an appointment request | Public, rate-limited |
| POST | `/api/contact` | Send a contact message | Public, rate-limited |
| GET | `/api/administration` | Administration section (settings, offices, directors) | Public |
| GET | `/api/department-details/{department_id}` | Extra content of a department details page | Public |
| POST | `/api/auth/doctor-signup` | Create an unverified doctor account | Public, rate-limited |
| POST | `/api/auth/verify-email` | Check the 6-digit code | Public, rate-limited |
| POST | `/api/auth/login` | Obtain a token | Public |
| GET / PATCH | `/api/doctor/appointments` | List / decide own appointments | Doctor |
| POST | `/api/auth/change-password` | Change own password | Logged in |
| GET / PUT / POST / DELETE | `/api/admin/administration/{settings,offices,directors}` | Manage the Administration section | Admin |
| GET / PUT | `/api/admin/department-details/{department_id}` | Edit the details page of a department | Admin |
| POST | `/api/admin/doctor-accounts/{id}/reset-password` | Temporary password for a doctor | Admin |

Other content routes (`hospital`, `departments`, `services`, `news`, `uploads`, ...) follow the same pattern: public `GET`, admin-only writes.

---

## Multilingual support

- Languages: **Arabic (RTL)**, **French**, **English**.
- The Arabic version mirrors the whole layout using logical CSS properties.
- Frontend dictionaries live in `frontend/lib/i18n.tsx`; admin-panel phrases in `frontend/lib/adminI18n.ts` / `adminPhrases.ts`. To translate a new admin label, add the English phrase as a key in the `fr` and `ar` dictionaries of `adminPhrases.ts`.

---

## Security

- JWT stored in an **httpOnly cookie** (never readable by JavaScript); all authenticated calls go through a server-side proxy (`/api/proxy`).
- Argon2/bcrypt password hashing, minimum 8 characters.
- Lock after 5 failed logins; uniform error messages.
- Rate limiting on contact, booking, sign-up and code verification.
- Role checks on every protected route; doctors can only read their own appointments.
- Public API hides doctors' e-mail and phone number.
- Image uploads verified by type, size and real file signature.
- Strict CORS and security headers (`nosniff`, frame deny, referrer policy).
- In production the server **refuses to start** with a weak secret or a default admin password; API docs are disabled.
- All forms are validated in the browser **and** in the backend (the backend is the authority).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend cannot reach the API | Check `NEXT_PUBLIC_API_URL` and that the backend runs on port 8000; add the frontend URL to `CORS_ORIGINS` |
| Images do not display | Uploaded images are served by the backend; make sure `NEXT_PUBLIC_API_URL` is correct |
| New admin page shows English labels in Arabic/French | Add the missing phrases to `frontend/lib/adminPhrases.ts` |
| Browser still shows the old favicon | Hard refresh (Ctrl+F5); replace the old `app/favicon.ico` |
| Verification e-mail never arrives | Check the `SMTP_*` variables (for Gmail use an app password) |
| Backend refuses to start in production | Set a strong `JWT_SECRET_KEY` and change the default admin password |

---

## Roadmap

- E-mail / SMS notification to the patient when a request is confirmed or rejected
- "Forgot password" link by e-mail for doctors
- Patient accounts with appointment history
- Statistics dashboard for the administrator
- Automated tests and a deployment pipeline

---

## Author

**BENAISSA Bochra** — National School of Artificial Intelligence (ENSIA), Semester 7, 2026/2027
Host organization: Public Hospital Establishment of N'Gaous
