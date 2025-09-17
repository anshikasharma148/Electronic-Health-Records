# Electronic Health Records (EHR) Dashboard

A secure Next.js dashboard with an Express/MongoDB backend for patient management, clinical workflows (notes, vitals, labs), and billing (eligibility, claims, payments, reports). Role-based access control protects all operations.

**Live Frontend:** [https://electronic-health-records.vercel.app/](https://electronic-health-records.vercel.app/)
**Live Backend API:** [https://electronic-health-records-oi97.onrender.com](https://electronic-health-records-oi97.onrender.com)
**Repository:** [https://github.com/anshikasharma148/Electronic-Health-Records](https://github.com/anshikasharma148/Electronic-Health-Records)

---

## Stack

* **Frontend:** Next.js (TypeScript), Axios, Tailwind UI components
* **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB)
* **Auth & Security:** JWT, Helmet, rate limiting, CORS, HPP, xss-clean, audit logging
* **Hosting:** Vercel (frontend), Render (backend), MongoDB Atlas

---

## Quick Start (Local Development)

### Prerequisites

* Node.js 18+ (LTS recommended)
* MongoDB Atlas URI or local MongoDB
* npm or yarn

### 1) Clone the repository

```bash
git clone https://github.com/anshikasharma148/Electronic-Health-Records.git
cd Electronic-Health-Records
```

### 2) Start the backend (Express)

Create `backend/.env` with values appropriate for your environment:

```bash
# backend/.env
PORT=5000
MONGODB_URI="your-mongodb-connection-string"
JWT_SECRET="a-strong-random-secret"
# Optional: restrict CORS in production. For local dev you can omit or set to *
CORS_ORIGIN=http://localhost:3000
```

Install dependencies and run:

```bash
cd backend
npm install
# Development (TypeScript via ts-node-dev):
npm run dev
# or build + start:
npm run build
npm start
```

The API should be available at:

```
http://localhost:5000
```

Health check:

```
GET http://localhost:5000/api/health  -> { "ok": true }
```

### 3) Start the frontend (Next.js)

Create `frontend/.env.local`:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Install dependencies and run:

```bash
cd ../frontend
npm install
npm run dev
```

The app should be available at:

```
http://localhost:3000
```

---

## Configuration (Production)

### Frontend (Vercel)

* Set `NEXT_PUBLIC_API_BASE_URL` to the public backend URL:

  ```
  NEXT_PUBLIC_API_BASE_URL=https://electronic-health-records-oi97.onrender.com
  ```

### Backend (Render or similar)

* Environment variables:

  ```
  PORT=10000        # Render assigns a port; use process.env.PORT in server
  MONGODB_URI=...   # Atlas connection string
  JWT_SECRET=...    # strong secret
  CORS_ORIGIN=https://electronic-health-records.vercel.app
  ```
* Start command (Render):

  * Development (used in logs): `npm run dev`
  * Recommended for production: `npm run build && npm start`

### MongoDB Atlas

* Ensure the hosting provider’s egress IPs are added to the Atlas IP allowlist.
* Verify the SRV connection string works from your Render shell.

---

## Authentication and Roles

* JWT stored in `localStorage`; Axios attaches `Authorization: Bearer <token>` on each request.
* Roles: `admin`, `provider`, `billing`, `viewer`.
* UI and API both enforce role-based permissions (mutations limited to authorized roles).

---

## Running Tests (Backend)

```bash
cd backend
npm test
```

---

## Troubleshooting

* **401 Unauthorized / redirect to login**

  * Token may be missing/expired. Log in again. The frontend clears invalid tokens automatically.
* **CORS errors**

  * Ensure `NEXT_PUBLIC_API_BASE_URL` matches the backend URL exactly.
  * Set `CORS_ORIGIN` on the backend to the frontend origin in production.
* **MongoDB connection**

  * Confirm `MONGODB_URI` and that the server IP is allowlisted in Atlas.
* **Mixed content**

  * Use HTTPS for both frontend and backend in production.

---

## Deployed Endpoints (Examples)

* `GET https://electronic-health-records-oi97.onrender.com/api/health`
* `POST /api/auth/login`, `POST /api/auth/signup`
* `GET /api/patients`, `GET /api/patients/:id`, `PUT /api/patients/:id`
* `GET /api/clinical/overview?patientId=...`, `POST /api/clinical/notes`, `POST /api/clinical/vitals`, `POST /api/clinical/labs`
* `GET /api/billing/reports`, `GET /api/billing/codes`, `GET/POST/PUT /api/billing/claims`, `GET/POST /api/billing/payments`, `GET /api/billing/balance`

---

## Notes

* Default ports: frontend 3000, backend 5000 (local).
* Update roles directly in the database if you need to elevate a user created via signup.
