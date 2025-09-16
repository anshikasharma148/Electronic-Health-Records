import { ReactNode } from "react"

type C = { children?: ReactNode }

export function Table({ children }: C) {
  return <div className="overflow-x-auto rounded-lg border border-neutral-200">{children}</div>
}
export function T({ children }: C) {
  return <table className="w-full text-sm">{children}</table>
}
export function Th({ children }: C) {
  return <th className="text-left px-3 py-2 font-medium bg-neutral-50 border-b">{children}</th>
}
export function Td({ children }: C) {
  return <td className="px-3 py-2 border-b">{children}</td>
}
