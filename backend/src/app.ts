import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import xss from "xss-clean";
import hpp from "hpp";
import { rateLimiter } from "./middleware/rateLimiter";
import { auditLogger } from "./middleware/auditLogger";
import patientRoutes from "./routes/patientRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import clinicalRoutes from "./routes/clinicalRoutes";
import billingRoutes from "./routes/billingRoutes";
import vitalRoutes from "./routes/vitalRoutes";
import ehrRoutes from "./routes/ehrRoutes";
import authRoutes from "./routes/authRoutes";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

const app = express();

// Behind Render’s proxy (helps rateLimiter / IPs)
app.set("trust proxy", 1);

// Explicit CORS: allow your Vercel app and local dev
const allowedOrigins = [
  "https://electronic-health-records.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server tools like Postman (no Origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // set true only if you move to cookie-based auth
  })
);

app.use(helmet());
app.use(express.json());
app.use(compression());
app.use(hpp());
app.use(xss());
app.use(morgan("dev"));
app.use(rateLimiter);
app.use(auditLogger);

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/vitals", vitalRoutes);
app.use("/api/ehr", ehrRoutes);

// Simple health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

export default app;
