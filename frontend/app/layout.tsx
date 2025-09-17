// app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"
import Topbar from "../components/layout/Topbar"

export const metadata: Metadata = {
  title: "EHR Integration Dashboard",
  description: "EHR CRUD & workflows",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <Topbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}