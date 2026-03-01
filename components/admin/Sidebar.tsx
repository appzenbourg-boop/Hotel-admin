'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bed,
  Bell,
  UserCog,
  Clock,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
}

const navItems: Omit<NavItem, 'badge'>[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin/dashboard' },
  { label: 'Properties', icon: <Building2 className="w-5 h-5" />, href: '/admin/properties' },
  { label: 'Bookings', icon: <Calendar className="w-5 h-5" />, href: '/admin/bookings' },
  { label: 'Guests', icon: <Users className="w-5 h-5" />, href: '/admin/guests' },
  { label: 'Rooms', icon: <Bed className="w-5 h-5" />, href: '/admin/rooms' },
  { label: 'Services', icon: <Bell className="w-5 h-5" />, href: '/admin/services' },
  { label: 'Staff', icon: <UserCog className="w-5 h-5" />, href: '/admin/staff' },
  { label: 'Attendance', icon: <Clock className="w-5 h-5" />, href: '/admin/attendance' },
  { label: 'Payroll', icon: <DollarSign className="w-5 h-5" />, href: '/admin/payroll' },
  { label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, href: '/admin/reports' },
  { label: 'Content', icon: <Building2 className="w-5 h-5" />, href: '/admin/content' },
  { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/admin/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [serviceCount, setServiceCount] = useState(0)
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'STAFF' // Default fallback

  // Fetch pending services count for the badge
  const fetchServiceCount = async () => {
    try {
      const res = await fetch('/api/admin/services')
      if (res.ok) {
        const data = await res.json()
        setServiceCount(data.length)
      }
    } catch (error) {
      console.error('Failed to fetch service count:', error)
    }
  }

  useEffect(() => {
    fetchServiceCount()
    const interval = setInterval(fetchServiceCount, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <aside
      data-tour="sidebar"
      className={cn(
        'fixed left-0 top-0 h-full backdrop-blur-xl bg-surface/80 border-r border-white/[0.08] transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Zenbourg</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-surface-light rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        {navItems
          .map(item => ({
            ...item,
            badge: item.href === '/admin/services' ? serviceCount : undefined
          }))
          .filter(item => {
            // RBAC Logic
            if (userRole !== 'SUPER_ADMIN' && item.href === '/admin/properties') {
              return false
            }

            if (userRole === 'MANAGER' || userRole === 'RECEPTIONIST') {
              // Unified view for Manager/Receptionist - focus on operations
              const forbiddenItems = ['/admin/payroll', '/admin/reports', '/admin/content', '/admin/settings']
              if (forbiddenItems.includes(item.href)) return false
            }
            if (userRole === 'STAFF') {
              // Staff only sees basic operational items
              const staffItems = ['/admin/dashboard', '/admin/bookings', '/admin/rooms', '/admin/services', '/admin/attendance']
              return staffItems.includes(item.href)
            }
            return true
          })
          .map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-surface-light hover:text-text-primary'
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={cn(isActive && 'text-white')}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-danger rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                )}
              </Link>
            )
          })}
      </nav>

      {/* Hotel Name (Bottom) */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-surface-light/50">
          <p className="text-xs text-text-secondary">Zenbourg Grand Hotel</p>
          <p className="text-xs text-text-tertiary">Mumbai, India</p>
        </div>
      )}
    </aside>
  )
}
