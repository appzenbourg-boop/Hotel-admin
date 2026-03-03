'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ArrowLeft, Save, Calendar, User, Bed, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

export default function NewBookingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [rooms, setRooms] = useState<any[]>([])
    const [guests, setGuests] = useState<any[]>([])

    // Form State
    const [formData, setFormData] = useState({
        guestId: '',
        roomId: '',
        checkIn: '',
        checkOut: '',
        numberOfGuests: 1,
        totalAmount: 0,
        source: 'DIRECT'
    })

    // Fetch Data
    useEffect(() => {
        const fetchResources = async () => {
            const params = new URLSearchParams(window.location.search)
            const preRoomId = params.get('roomId')

            try {
                const [roomsRes, guestsRes] = await Promise.all([
                    fetch('/api/admin/rooms?status=AVAILABLE'),
                    fetch('/api/admin/guests')
                ])

                if (roomsRes.ok) {
                    const roomList = await roomsRes.json()
                    setRooms(roomList)
                    if (preRoomId) setFormData(prev => ({ ...prev, roomId: preRoomId }))
                }
                if (guestsRes.ok) setGuests(await guestsRes.json())
            } catch (error) {
                console.error("Failed to load resources", error)
                toast.error("Failed to load rooms or guests")
            }
        }
        fetchResources()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/admin/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Booking failed')

            toast.success('Booking created successfully')
            router.push('/admin/bookings')
            router.refresh()
        } catch (error) {
            toast.error('Failed to create booking')
        } finally {
            setLoading(false)
        }
    }

    // Dynamic Price Calculation (Mock logic)
    useEffect(() => {
        if (formData.roomId && formData.checkIn && formData.checkOut) {
            const room = rooms.find(r => r.id === formData.roomId)
            if (room) {
                const start = new Date(formData.checkIn)
                const end = new Date(formData.checkOut)
                const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
                setFormData(prev => ({ ...prev, totalAmount: room.basePrice * nights }))
            }
        }
    }, [formData.roomId, formData.checkIn, formData.checkOut, rooms])

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
                    Back
                </Button>
                <h1 className="text-3xl font-bold text-text-primary">New Booking</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="space-y-6">
                        <div className="pb-4 border-b border-white/[0.08]">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Guest Details
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-text-secondary">Select Guest</label>
                                <select
                                    className="w-full bg-surface-light border border-white/[0.08] rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.guestId}
                                    onChange={e => setFormData({ ...formData, guestId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Choose a Guest --</option>
                                    {guests.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} ({g.phone})</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-xs text-text-tertiary">Don&apos;t see the guest?</p>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/admin/guests?addNew=true')}
                                        className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                    >
                                        <span>+</span> Add New Guest
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="space-y-6">
                        <div className="pb-4 border-b border-white/[0.08]">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                Stay Logic
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Check-in Date"
                                type="date"
                                value={formData.checkIn}
                                onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
                                required
                            />
                            <Input
                                label="Check-out Date"
                                type="date"
                                value={formData.checkOut}
                                onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-secondary">Room Selection</label>
                            <select
                                className="w-full bg-surface-light border border-white/[0.08] rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                value={formData.roomId}
                                onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                                required
                            >
                                <option value="">-- Choose a Room --</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.roomNumber} ({r.type}) - ${r.basePrice}/night</option>
                                ))}
                            </select>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-surface/50 backdrop-blur-xl border-primary/20 sticky top-6">
                        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-success" />
                            Billing Summary
                        </h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Base Amount</span>
                                <span className="font-mono text-text-primary">${formData.totalAmount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Taxes (10%)</span>
                                <span className="font-mono text-text-primary">${Math.round(formData.totalAmount * 0.1)}</span>
                            </div>
                            <div className="border-t border-white/[0.08] my-2 pt-2 flex justify-between font-bold">
                                <span className="text-text-primary">Total</span>
                                <span className="text-2xl text-success">${Math.round(formData.totalAmount * 1.1)}</span>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full"
                            size="lg"
                            type="submit"
                            onClick={(e) => handleSubmit(e)}
                            loading={loading}
                            disabled={!formData.guestId || !formData.roomId || !formData.checkIn || !formData.checkOut}
                        >
                            Confirm Booking
                        </Button>
                    </Card>
                </div>
            </form>
        </div>
    )
}
