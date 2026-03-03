'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/common/Avatar'
import StatusBadge from '@/components/common/StatusBadge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { toast } from 'sonner'
import { formatCurrency, formatRelativeTime, calculateOccupancy } from '@/lib/utils'
import { buildContextUrl, isGlobalContext } from '@/lib/admin-context'
import {
  ArrowUp,
  ArrowDown,
  Users,
  Bed,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Send,
  Plus,
  Bell,
  Search,
  Filter
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'STAFF' // Default fallback

  /* New Quick Actions State */
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [todayReservations, setTodayReservations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const [serviceForm, setServiceForm] = useState({
    roomId: '',
    type: 'HOUSEKEEPING',
    title: '',
    description: '',
    priority: 'NORMAL'
  })

  /**
   * Guard: blocks property-specific actions when in Global Overview.
   * Shows a rich toast directing the admin to select a hotel first.
   * Returns true if blocked, false if ok to proceed.
   */
  const requireHotel = (actionName: string = 'this action'): boolean => {
    if (isGlobalContext()) {
      toast.error(`Please select a hotel first`, {
        description: `"${actionName}" requires a specific hotel context. Use the hotel switcher in the header.`,
        action: {
          label: 'Select Hotel →',
          onClick: () => {
            // Click the PropertySwitcher button in the header
            const switcher = document.querySelector('[data-property-switcher]') as HTMLButtonElement
            if (switcher) switcher.click()
            else {
              // Fallback: scroll to top so user can see switcher
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }
        },
        duration: 5000,
      })
      return true // blocked
    }
    return false // ok to proceed
  }

  // Fetch Rooms for Service Modal
  const fetchRooms = async () => {
    try {
      const res = await fetch(buildContextUrl('/api/admin/rooms', { status: 'ALL' }))
      if (res.ok) {
        const roomsData = await res.json()
        setRooms(roomsData)
      }
    } catch (error) {
      console.error('Failed to fetch rooms')
    }
  }

  // Fetch Reservations for Check-in Modal
  const fetchReservations = async () => {
    try {
      const today = new Date()
      const start = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const end = new Date(today.setHours(23, 59, 59, 999)).toISOString()
      const res = await fetch(buildContextUrl('/api/admin/bookings', { start, end }))
      if (res.ok) {
        const bookingsData = await res.json()
        setTodayReservations(bookingsData.filter((b: any) => b.status === 'RESERVED'))
      }
    } catch (error) {
      console.error('Failed to fetch reservations')
    }
  }

  const handleRaiseService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceForm.roomId || !serviceForm.title) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      })

      if (res.ok) {
        toast.success('Service ticket raised successfully')
        setShowServiceModal(false)
        setServiceForm({ roomId: '', type: 'HOUSEKEEPING', title: '', description: '', priority: 'NORMAL' })
      } else {
        const errText = await res.text()
        console.error('[RAISE_TICKET_ERROR]', res.status, errText)
        toast.error(`Failed to raise ticket: ${errText || res.statusText}`)
      }
    } catch (error) {
      console.error('[RAISE_TICKET_EXCEPTION]', error)
      toast.error('Something went wrong')
    }
  }

  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'CHECK_IN' })
      })

      if (res.ok) {
        toast.success('Guest checked in successfully')
        setShowCheckInModal(false)
        fetchReservations() // Refresh List
      } else {
        toast.error('Failed to check in guest')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  const handleCheckOut = async (bookingId: string) => {
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'CHECK_OUT' })
      })

      if (res.ok) {
        toast.success('Guest checked out successfully')
        window.location.reload()
      } else {
        toast.error('Failed to check out guest')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  /* State */
  const [data, setData] = useState<any>({
    stats: {
      todayCheckIns: 0, todayCheckOuts: 0, occupancyRate: 0, availableRooms: 0,
      pendingHousekeeping: 0, activeFoodOrders: 0, slaBreaches: 0, onDutyStaff: 0,
      todayRevenue: 0, monthRevenue: 0
    },
    recentCheckIns: [],
    recentDepartures: [],
    housekeepingTasks: [],
    onDutyStaff: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        if (response.ok) {
          const resData = await response.json()
          // Transform flat response to nested structure if needed, or adjust state
          setData({
            stats: resData,
            recentCheckIns: resData.recentCheckIns || [],
            recentDepartures: resData.recentDepartures || [],
            housekeepingTasks: resData.housekeepingTasks || [],
            onDutyStaff: []
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchStats()
    }
  }, [session])

  const { stats } = data

  const handleEscalate = async () => {
    if (requireHotel('Escalate Issue')) return
    const oldestTask = data.housekeepingTasks[0]
    if (!oldestTask) {
      toast.info('No pending tasks to escalate')
      return
    }

    try {
      const res = await fetch('/api/admin/services/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: oldestTask.id, priority: 'URGENT' })
      })

      if (res.ok) {
        toast.success(`Task in Room ${oldestTask.room} escalated to URGENT priority`, {
          description: 'Staff notifications sent.'
        })
        router.refresh()
      } else {
        toast.error('Failed to escalate task')
      }
    } catch (error) {
      toast.error('Failed to escalate task')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      {/* Header */}
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 backdrop-blur-3xl" />
        <div className="absolute inset-0 border border-white/10 rounded-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Welcome back, {session?.user?.name || 'Admin'}
            </h1>
            <p className="text-lg text-indigo-200 mt-2 font-medium">
              Here&apos;s what&apos;s happening at Zenbourg Grand Hotel today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              data-tour="raise-service"
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 border-white/10 text-white backdrop-blur-md"
              leftIcon={<Bell className="w-4 h-4" />}
              onClick={() => {
                if (requireHotel('Raise Service Request')) return
                fetchRooms()
                setShowServiceModal(true)
              }}
            >
              Raise Service Request
            </Button>
            <Button
              data-tour="guest-checkin"
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 border-white/10 text-white backdrop-blur-md"
              leftIcon={<UserCheck className="w-4 h-4" />}
              onClick={() => {
                if (requireHotel('Guest Check-in')) return
                fetchReservations()
                setShowCheckInModal(true)
              }}
            >
              Guest Check-in
            </Button>
            <Button
              data-tour="new-booking"
              variant="primary"
              className="shadow-lg shadow-indigo-500/20"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                if (requireHotel('New Booking')) return
                window.location.href = '/admin/bookings/new'
              }}
            >
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div data-tour="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today Check-ins */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Today Check-ins</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{stats.todayCheckIns}</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <span>2 Pending</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Today Check-outs */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Today Check-outs</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{stats.todayCheckOuts}</p>
              <p className="text-xs text-text-tertiary mt-1">3 Remaining</p>
            </div>
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-info" />
            </div>
          </div>
        </Card>

        {/* Occupancy */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Current Occupancy</p>
              <p className="text-3xl font-bold text-text-primary mt-2">{stats.occupancyRate}%</p>
              <p className="text-xs text-text-tertiary mt-1">{stats.availableRooms} rooms available</p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <Bed className="w-6 h-6 text-success" />
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </Card>

        {/* Revenue */}
        {/* Revenue - OWNER & SUPER ADMIN */}
        {['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(userRole) && (
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Today Revenue</p>
                <p className="text-3xl font-bold text-text-primary mt-2">
                  {formatCurrency(stats.todayRevenue)}
                </p>
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <span>+12% vs yesterday</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card data-tour="quick-actions">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              if (requireHotel('Express Check-in')) return
              fetchReservations()
              setShowCheckInModal(true)
            }}
            className="p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-left"
          >
            <UserCheck className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-text-primary">Express Check-in</p>
            <p className="text-xs text-text-secondary mt-1">Today&apos;s arrivals</p>
          </button>
          <button
            onClick={() => {
              if (requireHotel('Raise Ticket')) return
              fetchRooms()
              setShowServiceModal(true)
            }}
            className="p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors text-left"
          >
            <Bell className="w-6 h-6 text-amber-500 mb-2" />
            <p className="font-medium text-text-primary">Raise Ticket</p>
            <p className="text-xs text-text-secondary mt-1">Room services</p>
          </button>
          <button
            onClick={() => {
              if (requireHotel('New Booking')) return
              router.push('/admin/bookings/new')
            }}
            className="p-4 bg-info/10 hover:bg-info/20 rounded-lg transition-colors text-left"
          >
            <Plus className="w-6 h-6 text-info mb-2" />
            <p className="font-medium text-text-primary">Add Booking</p>
            <p className="text-xs text-text-secondary mt-1">Walk-in or phone</p>
          </button>
          <button
            onClick={() => router.push('/admin/rooms')}
            className="p-4 bg-success/10 hover:bg-success/20 rounded-lg transition-colors text-left"
          >
            <Bed className="w-6 h-6 text-success mb-2" />
            <p className="font-medium text-text-primary">Assign Room</p>
            <p className="text-xs text-text-secondary mt-1">Quick assignment</p>
          </button>
          <button
            onClick={handleEscalate}
            className="p-4 bg-danger/10 hover:bg-danger/20 rounded-lg transition-colors text-left"
          >
            <AlertCircle className="w-6 h-6 text-danger mb-2" />
            <p className="font-medium text-text-primary">Escalate Issue</p>
            <p className="text-xs text-text-secondary mt-1">Priority service</p>
          </button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Check-ins */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Today&apos;s Arrivals</h2>
              <Badge variant="info">{stats.todayCheckIns} Guests</Badge>
            </div>
            <div className="space-y-3">
              {data.recentCheckIns.length > 0 ? (
                data.recentCheckIns.map((guest: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-surface-light rounded-lg hover:bg-border transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={guest.guest} />
                      <div>
                        <p className="font-medium text-text-primary">{guest.guest}</p>
                        <p className="text-xs text-text-secondary">Room {guest.room} • Arriving Today</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {guest.status === 'RESERVED' && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckIn(guest.id);
                          }}
                        >
                          Check-in
                        </Button>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning" />
                        <StatusBadge status={guest.status} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-secondary p-4 text-center">No check-ins today.</p>
              )}
            </div>
          </Card>

          {/* Today's Departures */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Today&apos;s Departures</h2>
              <Badge variant="warning">{stats.todayCheckOuts} Guests</Badge>
            </div>
            <div className="space-y-3">
              {data.recentDepartures.length > 0 ? (
                data.recentDepartures.map((guest: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-surface-light rounded-lg hover:bg-border transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={guest.guest} />
                      <div>
                        <p className="font-medium text-text-primary">{guest.guest}</p>
                        <p className="text-xs text-text-secondary">Room {guest.room} • Departing Today</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {guest.status === 'CHECKED_IN' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckOut(guest.id);
                          }}
                        >
                          Check-out
                        </Button>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning" />
                        <StatusBadge status={guest.status} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-secondary p-4 text-center">No departures today.</p>
              )}
            </div>
          </Card>

          {/* Housekeeping Status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Active Service Requests</h2>
              <div className="flex items-center gap-2">
                {stats.slaBreaches > 0 && (
                  <Badge variant="danger">{stats.slaBreaches} Overdue</Badge>
                )}
                <Badge variant="warning">{stats.pendingHousekeeping} Tasks</Badge>
              </div>
            </div>
            <div className="space-y-3">
              {data.housekeepingTasks.length > 0 ? (
                data.housekeepingTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-surface-light rounded-lg cursor-pointer hover:bg-border transition-all"
                    onClick={() => router.push(`/admin/services?id=${task.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center font-black text-xs border border-white/5">
                        {task.room}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary capitalize">{task.type.replace('_', ' ')}</p>
                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                          {task.title}
                        </p>
                      </div>
                    </div>
                    <Badge variant="info">PENDING</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-secondary p-4 text-center">No pending tasks.</p>
              )}
            </div>
            <Button variant="secondary" className="w-full mt-4" onClick={() => router.push('/admin/services')}>
              View All Tasks
            </Button>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* On-Duty Staff */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">On-Duty Staff</h2>
              <Badge variant="success">{stats.onDutyStaff} Active</Badge>
            </div>
            <div className="space-y-2">
              {stats.onDutyStaffNames && stats.onDutyStaffNames.length > 0 ? (
                stats.onDutyStaffNames.map((name: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-surface-light hover:bg-border transition-colors cursor-default">
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-[10px] font-bold text-success border border-success/30">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary leading-none">{name}</p>
                      <p className="text-[10px] text-success font-medium mt-1">Clocked In</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-xs text-text-tertiary">No staff members are currently clocked in.</p>
                </div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest" onClick={() => router.push('/admin/attendance')}>
              Go to Attendance
            </Button>
          </Card>

          {/* Activity Log */}
          <Card className="border-indigo-500/10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Live Activity Log</h2>
            <div className="space-y-4">
              {stats.activityLog && stats.activityLog.length > 0 ? (
                stats.activityLog.map((log: any, i: number) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs text-text-primary leading-tight">
                        <span className="font-bold">{log.action}</span> for Room {log.room}
                      </p>
                      <p className="text-[10px] text-text-tertiary font-bold">{log.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-[10px] text-text-tertiary">No recent activities.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Month Revenue */}
          {/* Month Revenue - OWNER & SUPER ADMIN */}
          {['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(userRole) && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <p className="text-sm font-medium text-text-secondary mb-2">Month Revenue</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(stats.monthRevenue)}
              </p>
              <p className="text-xs text-success mt-2 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <span>+18% vs last month</span>
              </p>
            </Card>
          )}
        </div>

        {/* Express Check-in Modal */}
        <Modal
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          title="Express Check-in"
          description="Quickly check-in guests with reservations for today"
        >
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search guest name or reservation..."
                className="w-full pl-10 pr-4 py-2 bg-surface-light border border-white/10 rounded-xl outline-none focus:border-primary transition-colors text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {todayReservations
                .filter(b => b.guest?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((booking) => (
                  <div key={booking.id} className="p-4 bg-surface-light rounded-xl border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div>
                      <p className="font-bold text-text-primary">{booking.guest.name}</p>
                      <p className="text-xs text-text-tertiary">Room {booking.room.roomNumber} • {booking.source}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleCheckIn(booking.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Check-in
                    </Button>
                  </div>
                ))}
              {todayReservations.length === 0 && (
                <p className="text-center py-8 text-sm text-text-tertiary">No pending reservations for today.</p>
              )}
            </div>
          </div>
        </Modal>

        {/* Raise Service Modal */}
        <Modal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          title="Raise Service Ticket"
          description="Create a new housekeeping or maintenance request"
        >
          <form onSubmit={handleRaiseService} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Room"
                value={serviceForm.roomId}
                onChange={(e) => setServiceForm({ ...serviceForm, roomId: e.target.value })}
                options={[
                  { value: '', label: 'Select Room' },
                  ...rooms.map(r => ({ value: r.id, label: `Room ${r.roomNumber}` }))
                ]}
                required
              />
              <Select
                label="Ticket Type"
                value={serviceForm.type}
                onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                options={[
                  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                  { value: 'ROOM_SERVICE', label: 'Room Service' },
                  { value: 'FOOD_ORDER', label: 'Food & Beverage' },
                  { value: 'LAUNDRY', label: 'Laundry' },
                  { value: 'CONCIERGE', label: 'Concierge' },
                ]}
              />
            </div>

            <Input
              label="Title / Brief Requirement"
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              placeholder="e.g. AC not working / Extra towels"
              required
            />

            <Input
              label="Detailed Description"
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Provide more details if needed..."
            />

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="secondary" onClick={() => setShowServiceModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Raise Ticket</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}
