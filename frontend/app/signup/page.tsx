"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { signup } from "@/lib/auth"
import {
  UserPlusIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline"

type Role = "admin" | "provider" | "billing" | "viewer"

// Role descriptions for better UX
const roleDescriptions: Record<Role, string> = {
  viewer: "View patient data only",
  provider: "Provide care and update records",
  billing: "Handle financial operations",
  admin: "Full system access and management"
}

export default function Page() {
  const r = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("viewer")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string, password?: string}>({})

  const validateForm = () => {
    const newErrors: {email?: string, password?: string} = {}
    
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }
    
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setErrors({})

    const safeEmail = email.trim().toLowerCase()

    try {
      await signup(safeEmail, password, role)
      r.replace("/dashboard")
    } catch (ex: any) {
      const status = ex?.response?.status
      const raw = String(ex?.response?.data?.message || ex?.message || "")
      const isDuplicate =
        status === 409 || /E11000|duplicate key|already exists|exist/i.test(raw)

      if (isDuplicate) {
        setErrors({email: "An account with this email already exists"})
        setTimeout(() => {
          r.replace("/login")
        }, 2000)
      } else {
        alert("Could not create the account. Please try again or contact the admin.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 grid place-items-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <UserPlusIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join our healthcare platform today</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={submit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  hasError={!!errors.email}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  placeholder="Create a password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="pl-10"
                  hasError={!!errors.password}
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Select 
                  value={role} 
                  onChange={e => setRole(e.target.value as Role)}
                  className="pl-10"
                >
                  <option value="viewer">Viewer</option>
                  <option value="provider">Provider</option>
                  <option value="billing">Billing</option>
                  <option value="admin">Administrator</option>
                </Select>
              </div>
              <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                {roleDescriptions[role]}
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full py-3 flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Create Account
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center gap-1"
              >
                Log in <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </main>
  )
}