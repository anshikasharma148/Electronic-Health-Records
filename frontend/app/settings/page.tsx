"use client"
import Button from "@/components/ui/Button"
import { logout } from "@/lib/auth"
import { 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon, 
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  LanguageIcon
} from "@heroicons/react/24/outline"

export default function Page() {
  const handleLogout = () => {
    logout(); 
    window.location.href = "/login"
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Cog6ToothIcon className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* API Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <ServerIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">API Configuration</h2>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">API Base URL</div>
            <div className="font-mono text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
              {process.env.NEXT_PUBLIC_API_BASE_URL}
            </div>
          </div>
        </div>

        {/* App Settings Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Application Settings</h2>
          
          <div className="space-y-4">
            {/* Notification Settings */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <BellIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Notifications</div>
                  <div className="text-sm text-gray-600">Manage your notification preferences</div>
                </div>
              </div>
              <div className="w-10 h-5 bg-gray-300 rounded-full relative">
                <div className="absolute w-3 h-3 bg-white rounded-full top-1 left-1 transition-transform"></div>
              </div>
            </div>

            {/* Language Settings */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <LanguageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Language</div>
                  <div className="text-sm text-gray-600">English (US)</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Change</div>
            </div>

            {/* Privacy Settings */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Privacy & Security</div>
                  <div className="text-sm text-gray-600">Manage your data and privacy</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Manage</div>
            </div>

            {/* Account Settings */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Account</div>
                  <div className="text-sm text-gray-600">Update your account information</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Edit</div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Session</h2>
          </div>
          <p className="text-gray-600 mb-4">Sign out of your account. You'll need to sign in again to access the system.</p>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </Button>
        </div>

        {/* App Version */}
        <div className="text-center text-sm text-gray-500">
          HealthOS v1.2.0
        </div>
      </div>
    </div>
  )
}