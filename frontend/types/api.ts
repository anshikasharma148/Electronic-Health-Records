export type Id = string
export type Patient = { _id: Id; firstName: string; lastName: string; dob: string; gender: string; contact?: { phone?: string; email?: string; address?: string } }
export type Paginated<T> = { items: T[]; total: number; page: number; limit: number }
