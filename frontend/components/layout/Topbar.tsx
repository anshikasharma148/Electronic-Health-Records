// frontend/components/layout/Topbar.tsx
"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { logout } from "@/lib/auth" // assumes your auth lib exports logout()

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("")
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Set active tab based on current route
  useEffect(() => {
    const path = pathname || ""
    setActiveTab(path.split('/')[1] || "dashboard")
  }, [pathname])

  const handleLogout = () => {
    try {
      logout()
    } catch {
      // fallback: clear likely keys if logout() is a no-op in your setup
      try {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      } catch {}
    } finally {
      router.replace("/login")
    }
  }

  return (
    <header className="h-16 border-b border-gray-200 flex items-center px-6 justify-between bg-white shadow-sm sticky top-0 z-50">
      {/* Logo Section */}
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span className="font-bold text-xl text-gray-800 tracking-tight">EHR</span>
        <span className="ml-2 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">v2.1</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex items-center h-full">
        <NavItem 
          href="/dashboard" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          } 
          label="Overview" 
          isActive={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        />
        
        <NavItem 
          href="/patients" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          } 
          label="Patients" 
          isActive={activeTab === "patients"}
          onClick={() => setActiveTab("patients")}
        />
        
        <NavItem 
          href="/appointments" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          } 
          label="Appointments" 
          isActive={activeTab === "appointments"}
          onClick={() => setActiveTab("appointments")}
        />
        
        <NavItem 
          href="/clinical" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          } 
          label="Clinical" 
          isActive={activeTab === "clinical"}
          onClick={() => setActiveTab("clinical")}
        />
        
        <NavItem 
          href="/billing" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } 
          label="Billing" 
          isActive={activeTab === "billing"}
          onClick={() => setActiveTab("billing")}
        />
        
        <NavItem 
          href="/settings" 
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          } 
          label="Settings" 
          isActive={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </nav>
      
      {/* User Profile/Notifications */}
      <div className="flex items-center">
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 mr-2 relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Avatar + dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setUserMenuOpen(true)}
          onMouseLeave={() => setUserMenuOpen(false)}
        >
          <button
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 border border-gray-300 hover:bg-gray-100"
            onClick={() => setUserMenuOpen(v => !v)} // tap/click support
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {/* Dropdown */}
          <div
            className={`absolute right-0 mt-2 w-44 rounded-lg border bg-white shadow-lg py-2 transition-all duration-150 ${
              userMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
            role="menu"
          >
            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
              onClick={() => setUserMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              role="menuitem"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// NavItem Component for better organization and animation
function NavItem({ href, icon, label, isActive, onClick }: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <Link 
      href={href} 
      className={`relative flex flex-col items-center justify-center px-4 py-2 text-sm transition-all duration-300 ease-in-out ${
        isActive 
          ? "text-blue-600 font-medium" 
          : "text-gray-600 hover:text-blue-500"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        {icon}
        <span className="ml-2">{label}</span>
      </div>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full transition-all duration-300"></div>
      )}
    </Link>
  )
}
