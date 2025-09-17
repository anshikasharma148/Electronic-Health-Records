import express from "express";
import cors, { CorsOptionsDelegate } from "cors";
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

/** CORS: allow deployed frontend + local dev, include Authorization, handle preflight */
const allowlist = [
  process.env.FRONTEND_ORIGIN || "https://electronic-health-records.vercel.app",
  "http://localhost:3000",
];

const corsDelegate: CorsOptionsDelegate = (req, cb) => {
  const origin = req.headers["origin"] as string | undefined;
  const isAllowed = !origin || allowlist.includes(origin);
  cb(null, {
    origin: isAllowed ? origin : false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false,
    maxAge: 86400,
  });
};

app.use(helmet());
app.use(cors(corsDelegate));
app.options("*", cors(corsDelegate)); // ensure all preflights get CORS headers

app.use(express.json());
app.use(compression());
app.use(hpp());
app.use(xss());
app.use(morgan("dev"));
app.use(rateLimiter);
app.use(auditLogger);

/** Simple root + ping endpoints for uptime checks */
app.get("/", (_req, res) => res.type("text").send("OK"));
app.head("/", (_req, res) => res.status(200).end());
app.get("/api/ping", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

/** API routes */
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/vitals", vitalRoutes);
app.use("/api/ehr", ehrRoutes);

/** Health endpoint */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

export default app;
