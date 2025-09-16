export const required = (v: string) => v.trim().length > 0
export const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v)
