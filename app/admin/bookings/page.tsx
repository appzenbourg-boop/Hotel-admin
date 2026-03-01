'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { startOfWeek, addDays, format, isSameDay, differenceInDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Search, Plus, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { CheckCircle2, LogOut, XCircle, Download } from 'lucide-react'
import { downloadCSV } from '@/lib/csv'

export default function BookingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [rooms, setRooms] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const startDate = useMemo(() => startOfWeek(currentDate), [currentDate])
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(startDate, i)), [startDate])
  const endDate = useMemo(() => days[6], [days])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const roomsRes = await fetch('/api/admin/rooms?status=ALL')
      const roomsData = await roomsRes.json()
      setRooms(roomsData)

      const bookingsRes = await fetch(`/api/admin/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
      const bookingsData = await bookingsRes.json()

      const formattedBookings = bookingsData.map((b: any) => ({
        id: b.id,
        guest: b.guest.name,
        room: b.room.roomNumber,
        startDate: new Date(b.checkIn),
        endDate: new Date(b.checkOut),
        nights: differenceInDays(new Date(b.checkOut), new Date(b.checkIn)),
        status: b.status,
        color: b.status === 'CHECKED_IN' ? 'bg-blue-600' :
          b.status === 'RESERVED' ? 'bg-yellow-500' : 'bg-gray-500'
      }))

      setBookings(formattedBookings)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateStatus = async (action: string) => {
    if (!selectedBooking) return
    setIsUpdating(true)
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedBooking.id, action })
      })

      if (res.ok) {
        toast.success(`Booking ${action.replace('_', ' ').toLowerCase()} successfully`)
        setSelectedBooking(null)
        fetchData()
      } else {
        toast.error('Failed to update booking')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7))
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7))

  // Helper to calculate position
  const getBookingStyle = (booking: any) => {
    const startDiff = differenceInDays(booking.startDate, startDate)
    const duration = booking.nights

    // If starts before current week, clamp
    const leftOffset = Math.max(0, startDiff)

    // If ends after current week, clamp visually (simplified)
    const width = Math.min(duration, 7 - leftOffset)

    return {
      left: `${(leftOffset / 7) * 100}%`,
      width: `${(width / 7) * 100}%`,
      marginLeft: '4px',
      marginRight: '4px'
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-text-primary">Bookings Panel</h1>
          <div className="flex items-center bg-surface-light rounded-lg border border-border p-1">
            <button
              onClick={handlePrevWeek}
              className="p-1 hover:bg-surface rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <span className="px-4 font-medium text-text-primary w-40 text-center">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1 hover:bg-surface rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => downloadCSV(bookings.map(b => ({
              Guest: b.guest,
              Room: b.room,
              CheckIn: format(b.startDate, 'dd-MM-yyyy'),
              CheckOut: format(b.endDate, 'dd-MM-yyyy'),
              Nights: b.nights,
              Status: b.status
            })), 'Bookings_Report')}
          >
            Export Report
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => window.location.href = '/admin/bookings/new'}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-surface/50 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col shadow-2xl">
        {/* Days Header */}
        <div className="flex border-b border-white/[0.08] bg-white/[0.02]">
          <div className="w-24 p-4 border-r border-white/[0.08] flex items-center justify-center">
            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Room</span>
          </div>
          <div className="flex-1 grid grid-cols-7">
            {days.map(day => (
              <div
                key={day.toString()}
                className={cn(
                  "p-3 text-center border-r border-white/[0.08] last:border-r-0 transition-colors",
                  isSameDay(day, new Date()) ? "bg-primary/10" : "hover:bg-white/[0.02]"
                )}
              >
                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">{format(day, 'EEE')}</p>
                <p className={cn(
                  "text-lg font-bold mt-1 inline-flex w-8 h-8 rounded-full items-center justify-center transition-all",
                  isSameDay(day, new Date()) ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-text-primary"
                )}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Room Rows */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-text-secondary">Loading schedule...</div>
          ) : (
            rooms.map(room => (
              <div key={room.id} className="flex border-b border-border h-20 hover:bg-surface-light/30 transition-colors">
                {/* Room Info */}
                <div className="w-24 p-3 border-r border-border flex flex-col justify-center bg-surface items-center">
                  <span className="font-bold text-lg text-text-primary">{room.roomNumber}</span>
                  <span className="text-[10px] text-text-secondary">{room.type}</span>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 grid grid-cols-7 relative">
                  {days.map(day => (
                    <div key={day.toString()} className="border-r border-border h-full" />
                  ))}

                  {/* Render Bookings */}
                  {bookings.filter(b => b.room === room.roomNumber).map(booking => {
                    if (differenceInDays(booking.startDate, endDate) > 0 || differenceInDays(booking.endDate, startDate) < 0) return null

                    return (
                      <div
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className={cn(
                          "absolute top-2 bottom-2 rounded-lg p-2 shadow-sm cursor-pointer hover:brightness-95 transition-all flex flex-col justify-center overflow-hidden z-10",
                          booking.color
                        )}
                        style={getBookingStyle(booking)}
                      >
                        <p className="text-white text-xs font-bold truncate">{booking.guest}</p>
                        <p className="text-white/80 text-[10px] truncate">{booking.nights} Nights</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Booking Details"
        description={`Manage reservation for ${selectedBooking?.guest}`}
      >
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-surface-light rounded-xl">
              <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Room</p>
              <p className="text-lg font-bold text-text-primary">{selectedBooking?.room}</p>
            </div>
            <div className="p-3 bg-surface-light rounded-xl">
              <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Status</p>
              <p className="text-lg font-bold text-text-primary">{selectedBooking?.status}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {selectedBooking?.status === 'RESERVED' && (
              <Button
                variant="primary"
                className="w-full bg-blue-600 hover:bg-blue-700"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                loading={isUpdating}
                onClick={() => handleUpdateStatus('CHECK_IN')}
              >
                Check In Guest
              </Button>
            )}
            {selectedBooking?.status === 'CHECKED_IN' && (
              <Button
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                leftIcon={<LogOut className="w-4 h-4" />}
                loading={isUpdating}
                onClick={() => handleUpdateStatus('CHECK_OUT')}
              >
                Check Out Guest
              </Button>
            )}
            {selectedBooking?.status !== 'COMPLETED' && selectedBooking?.status !== 'CANCELLED' && (
              <Button
                variant="secondary"
                className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                leftIcon={<XCircle className="w-4 h-4" />}
                loading={isUpdating}
                onClick={() => handleUpdateStatus('CANCEL')}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
