'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, User, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Don't show layout on login page
    if (pathname === '/staff/login') return <>{children}</>

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Mobile Header */}
            <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <h1 className="font-bold text-lg text-gray-900">Zenbourg Staff</h1>
                <button
                    onClick={() => signOut({ callbackUrl: '/staff/login' })}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {children}

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20 pb-safe">
                <Link href="/staff" className={`flex flex-col items-center ${pathname === '/staff' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Home</span>
                </Link>
                <Link href="/staff/tasks" className={`flex flex-col items-center ${pathname.startsWith('/staff/tasks') ? 'text-blue-600' : 'text-gray-400'}`}>
                    <ClipboardList className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Tasks</span>
                </Link>
                <Link href="/staff/profile" className={`flex flex-col items-center ${pathname === '/staff/profile' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <User className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Profile</span>
                </Link>
            </nav>
        </div>
    )
}

