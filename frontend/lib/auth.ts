import { api } from "./api"
import { API } from "./endpoints"

const save = (t: string) => localStorage.setItem("token", t)

export const logout = () => localStorage.removeItem("token")
export const isAuthed = () => !!localStorage.getItem("token")

export const signup = async (email: string, password: string, role: "admin"|"provider"|"billing"|"viewer") => {
  const { data } = await api.post(API.auth.signup, { email, password, role })
  save(data.token)
  return data
}

export const login = async (email: string, password: string) => {
  const { data } = await api.post(API.auth.login, { email, password })
  save(data.token)
  return data
}

/* optional helper if you want role on the client */
export type Role = "admin" | "provider" | "billing" | "viewer"
export const getUser = (): { id: string; role: Role } | null => {
  if (typeof window === "undefined") return null
  const t = localStorage.getItem("token")
  if (!t) return null
  try {
    const [, payload] = t.split(".")
    return JSON.parse(atob(payload))
  } catch { return null }
}
