export const API = {
  auth: { login: "/api/auth/login", signup: "/api/auth/signup" },
  patients: {
    root: "/api/patients",
    one: (id: string) => `/api/patients/${id}`,
    allergies: (id: string) => `/api/patients/${id}/allergies-conditions`,
    meds: (id: string) => `/api/patients/${id}/medications`,
    imm: (id: string) => `/api/patients/${id}/immunizations`,
  },
  appointments: {
    root: "/api/appointments",
    one: (id: string) => `/api/appointments/${id}`,
    availability: "/api/appointments/availability",
  },
  clinical: {
    overview: "/api/clinical/overview",
    notes: "/api/clinical/notes",
    vitals: "/api/clinical/vitals",
    claims: "/api/billing/claims",
    labs: "/api/clinical/labs",
    diagnoses: "/api/clinical/diagnoses",
    history: "/api/clinical/history",
  },
  billing: {
    eligibility: "/api/billing/eligibility",
    claims: "/api/billing/claims",
    payments: "/api/billing/payments",
    balance: "/api/billing/balance",
    reports: "/api/billing/reports",
    codes: "/api/billing/codes",
  },
  ehr: { patients: "/api/ehr/patients" },
} as const
