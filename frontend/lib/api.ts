import axios from "axios"

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
export const api = axios.create({ baseURL })

api.interceptors.request.use((cfg) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token")
    if (t) {
      cfg.headers = cfg.headers ?? {}
      ;(cfg.headers as any).Authorization = `Bearer ${t}`
    }
  }
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (typeof window !== "undefined" && err?.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)
