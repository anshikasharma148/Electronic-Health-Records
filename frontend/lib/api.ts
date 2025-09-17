import axios from "axios";

// Prefer env var (Vercel), fall back to same-origin in browser, and localhost in dev server-side.
const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
const baseURL =
  envBase ||
  (typeof window !== "undefined" ? "" : "http://localhost:5000"); // SSR dev fallback

export const api = axios.create({
  baseURL, // e.g. https://electronic-health-records-oi97.onrender.com
  timeout: 20000,
});

api.interceptors.request.use((cfg) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) {
      cfg.headers = cfg.headers ?? {};
      (cfg.headers as any).Authorization = `Bearer ${t}`;
    }
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (typeof window !== "undefined" && err?.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
