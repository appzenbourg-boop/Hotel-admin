'use client'

import { useSession, signOut } from 'next-auth/react'
import { User, Mail, Phone, LogOut, FileText } from 'lucide-react'

export default function StaffProfilePage() {
    const { data: session } = useSession()

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl mb-4">
                    {session?.user?.name?.[0] || 'S'}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{session?.user?.name || 'Staff Member'}</h2>
                <p className="text-gray-500">Housekeeping Staff</p>
                <span className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTIVE</span>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-400">Email Address</p>
                        <p className="text-sm font-medium text-gray-900">{session?.user?.email}</p>
                    </div>
                </div>
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-400">Employee ID</p>
                        <p className="text-sm font-medium text-gray-900">EMP-2024-001</p>
                    </div>
                </div>
                {/* Placeholder for future expansion */}
            </div>

            <button
                onClick={() => signOut({ callbackUrl: '/staff/login' })}
                className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </button>
        </div>
    )
}
