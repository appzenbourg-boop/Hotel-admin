'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Plus, Search, Trash2, Edit2,
    Upload, X, Image as ImageIcon,
    Bed, LayoutGrid, List, Filter,
    CheckCircle2, AlertCircle, MapPin, Users
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { buildContextUrl, getAdminContext } from '@/lib/admin-context'

type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING'

export default function RoomsPage() {
    const [rooms, setRooms] = useState<any[]>([])
    const [filterStatus, setFilterStatus] = useState<RoomStatus | 'ALL'>('ALL')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<any>(null)
    const [uploading, setUploading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        roomNumber: '',
        floor: '1',
        category: 'STANDARD',
        type: 'Standard King',
        basePrice: '150',
        maxOccupancy: '2',
        image: ''
    })

    const fetchRooms = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(buildContextUrl('/api/admin/rooms', { status: filterStatus }))
            if (res.ok) {
                const data = await res.json()
                setRooms(data)
            }
        } catch (error) {
            toast.error('Failed to fetch rooms')
        } finally {
            setLoading(false)
        }
    }, [filterStatus])

    useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    const handleOpenModal = (room?: any) => {
        if (room) {
            setSelectedRoom(room)
            setFormData({
                roomNumber: room.roomNumber,
                floor: room.floor.toString(),
                category: room.category,
                type: room.type,
                basePrice: room.basePrice.toString(),
                maxOccupancy: room.maxOccupancy.toString(),
                image: room.images?.[0] || ''
            })
        } else {
            setSelectedRoom(null)
            setFormData({
                roomNumber: '', floor: '1', category: 'STANDARD', type: 'Standard King', basePrice: '150', maxOccupancy: '2', image: ''
            })
        }
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const { propertyId } = getAdminContext()

        try {
            const url = selectedRoom ? `/api/admin/rooms/${selectedRoom.id}` : '/api/admin/rooms'
            const method = selectedRoom ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    images: formData.image ? [formData.image] : [],
                    propertyId: propertyId !== 'ALL' ? propertyId : undefined
                })
            })

            if (res.ok) {
                toast.success(selectedRoom ? 'Room updated' : 'Room created')
                setShowModal(false)
                fetchRooms()
            } else {
                const err = await res.text()
                toast.error(err || 'Failed to save room')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        // Simulate high-quality hotel photo upload
        setTimeout(() => {
            const mockPhoto = `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80`
            setFormData(prev => ({ ...prev, image: mockPhoto }))
            setUploading(false)
            toast.success('Room photography updated')
        }, 1200)
    }

    const getStatusStyles = (status: RoomStatus) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
            case 'OCCUPIED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]'
            case 'CLEANING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]'
            case 'MAINTENANCE': return 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]'
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Room Inventory</h1>
                    <p className="text-sm text-text-secondary mt-1 max-w-lg">Manage status, premium photography, and availability across your luxury floors.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>Filter</Button>
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
                        Add Room
                    </Button>
                </div>
            </div>

            {/* Status Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 noscrollbar">
                {['ALL', 'AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status as any)}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all border whitespace-nowrap",
                            filterStatus === status
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                : "bg-surface-light text-text-secondary border-border hover:bg-surface-light hover:text-text-primary"
                        )}
                    >
                        {status === 'ALL' ? 'Everything' : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {loading && !rooms.length ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : rooms.map(room => (
                    <div
                        key={room.id}
                        onClick={() => handleOpenModal(room)}
                        className="group relative bg-surface-light/40 border border-border rounded-2xl overflow-hidden hover:bg-surface-light/60 hover:border-primary/30 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2"
                    >
                        {/* Room Image */}
                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-surface-light">
                            {room.images?.[0] ? (
                                <img
                                    src={room.images[0]}
                                    alt={room.roomNumber}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-text-tertiary">
                                    <Bed className="w-10 h-10 opacity-20 mb-2" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Photography</span>
                                </div>
                            )}
                            <div className="absolute top-3 left-3 flex gap-2">
                                <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 uppercase tracking-widest">
                                    Floor {room.floor}
                                </span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                <div>
                                    <h3 className="text-2xl font-black text-white leading-none">{room.roomNumber}</h3>
                                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">{room.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-black text-lg leading-none">${room.basePrice}</p>
                                    <p className="text-[10px] text-white/50 font-bold uppercase leading-none mt-1">/ Night</p>
                                </div>
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="p-4 flex items-center justify-between bg-surface-light/20">
                            <div className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                                getStatusStyles(room.status)
                            )}>
                                {room.status}
                            </div>
                            <div className="flex items-center gap-1 text-text-tertiary">
                                <Users className="w-3 h-3" />
                                <span className="text-xs font-bold">{room.maxOccupancy}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Placeholder */}
                <button
                    onClick={() => handleOpenModal()}
                    className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-text-tertiary hover:border-primary hover:text-primary transition-all hover:bg-primary/5 min-h-[300px] group"
                >
                    <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg border border-border">
                        <Plus className="w-8 h-8 opacity-50 group-hover:opacity-100" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Add New Room</span>
                    <span className="text-xs mt-2 opacity-50">Configure floor & occupancy</span>
                </button>
            </div>

            {/* Upsert Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => !isSubmitting && setShowModal(false)}
                title={selectedRoom ? `Edit Room ${selectedRoom.roomNumber}` : 'Deploy New Room'}
                description="Luxury accommodations start with perfect data and immersive imagery."
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
                            {selectedRoom ? 'Update Room' : 'Confirm Launch'}
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Media Upload */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Room Photography</label>
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-light border border-dashed border-border group hover:border-primary/50 transition-all">
                            {formData.image ? (
                                <>
                                    <img src={formData.image} className="w-full h-full object-cover" alt="Room preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <label className="p-3 bg-white rounded-full cursor-pointer hover:scale-110 transition-transform text-slate-900 shadow-xl">
                                            <Upload className="w-5 h-5" />
                                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                        </label>
                                        <button
                                            onClick={() => setFormData({ ...formData, image: '' })}
                                            className="p-3 bg-white rounded-full hover:scale-110 transition-transform text-red-500 shadow-xl"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center p-8 text-center cursor-pointer group/upload">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover/upload:scale-110 transition-transform">
                                        {uploading ? <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /> : <ImageIcon className="w-8 h-8" />}
                                    </div>
                                    <p className="text-sm font-bold text-text-primary">Click to Upload</p>
                                    <p className="text-xs text-text-tertiary mt-2 leading-relaxed">High-definition 4K photography recommended for guest portal.</p>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Data Fields */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Room No."
                                value={formData.roomNumber}
                                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                                placeholder="101"
                            />
                            <Input
                                label="Floor"
                                type="number"
                                value={formData.floor}
                                onChange={e => setFormData({ ...formData, floor: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Category</label>
                                <select
                                    className="w-full bg-surface-light border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="STANDARD">Standard</option>
                                    <option value="DELUXE">Deluxe</option>
                                    <option value="SUITE">Suite</option>
                                    <option value="PENTHOUSE">Penthouse</option>
                                </select>
                            </div>
                            <Input
                                label="Type"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                placeholder="King Bed"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Rate ($)"
                                type="number"
                                value={formData.basePrice}
                                onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                            />
                            <Input
                                label="Occupants"
                                type="number"
                                value={formData.maxOccupancy}
                                onChange={e => setFormData({ ...formData, maxOccupancy: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
