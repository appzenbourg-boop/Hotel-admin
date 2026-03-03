'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Plus, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'
import { buildContextUrl } from '@/lib/admin-context'

export default function ServicesPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [staffList, setStaffList] = useState<any[]>([])
    const [assignmentId, setAssignmentId] = useState('')
    const [isAssigning, setIsAssigning] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [rooms, setRooms] = useState<any[]>([])
    const [newRequestData, setNewRequestData] = useState({
        type: 'HOUSEKEEPING',
        roomNumber: '',
        title: '',
        priority: 'NORMAL'
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchServices = async () => {
        setLoading(true)
        try {
            // Use buildContextUrl so propertyId context matches dashboard context
            const res = await fetch(buildContextUrl('/api/admin/services'))
            if (res.ok) {
                const data = await res.json()
                const parsed = data.map((d: any) => ({
                    ...d,
                    createdAt: new Date(d.requestTime || d.createdAt)
                }))
                setRequests(parsed)
            } else {
                const errText = await res.text()
                console.error('[FETCH_SERVICES_ERROR]', res.status, errText)
                toast.error(`Failed to load services: ${errText || res.statusText}`)
            }
        } catch (error) {
            console.error('[FETCH_SERVICES_EXCEPTION]', error)
            toast.error('Could not connect to server')
        } finally {
            setLoading(false)
        }
    }

    const fetchStaff = async () => {
        const res = await fetch('/api/admin/staff')
        if (res.ok) {
            const data = await res.json()
            setStaffList(data)
        }
    }

    const fetchRooms = async () => {
        const res = await fetch('/api/admin/rooms')
        if (res.ok) setRooms(await res.json())
    }

    useEffect(() => {
        fetchServices()
        fetchStaff()
        fetchRooms()
    }, [])

    const handleAssign = async () => {
        if (!assignmentId || !selectedRequest) return
        setIsAssigning(true)
        try {
            const res = await fetch(`/api/admin/services/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: selectedRequest.id,
                    assignedToId: assignmentId
                })
            })

            if (res.ok) {
                toast.success('Request assigned successfully')
                setSelectedRequest(null)
                setAssignmentId('')
                fetchServices()
            } else {
                const errText = await res.text()
                toast.error(`Failed to assign: ${errText}`)
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsAssigning(false)
        }
    }

    const handleNewRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const room = rooms.find(r => r.roomNumber === newRequestData.roomNumber)
            if (!room) {
                toast.error('Invalid room number')
                return
            }

            const res = await fetch('/api/admin/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newRequestData.type,
                    roomId: room.id,
                    title: newRequestData.title,
                    priority: newRequestData.priority
                })
            })

            if (res.ok) {
                toast.success('Request created successfully')
                setShowAddModal(false)
                fetchServices()
                setNewRequestData({ type: 'HOUSEKEEPING', roomNumber: '', title: '', priority: 'NORMAL' })
            } else {
                toast.error('Failed to create request')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/admin/services/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: id, status })
            })

            if (res.ok) {
                toast.success(`Request marked as ${status.toLowerCase().replace('_', ' ')}`)
                fetchServices()
            } else {
                toast.error('Failed to update request')
            }
        } catch (error) {
            toast.error('Something went wrong')
        }
    }

    // Update timers every minute
    useEffect(() => {
        const timer = setInterval(() => {
            const newElapsed: Record<string, string> = {}
            requests.forEach(req => {
                const diffMs = Date.now() - req.createdAt.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                newElapsed[req.id] = `${diffMins}m`
            })
            setElapsedTimes(newElapsed)
        }, 1000)

        return () => clearInterval(timer)
    }, [requests])

    const getSLAColor = (req: any) => {
        const diffMs = Date.now() - req.createdAt.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const sla = req.slaLimit || 60
        const percentage = (diffMins / sla) * 100

        if (percentage > 100) return 'text-danger bg-danger/10 border-danger/20'
        if (percentage > 75) return 'text-warning bg-warning/10 border-warning/20'
        return 'text-success bg-success/10 border-success/20'
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Services & Orders</h1>
                    <p className="text-text-secondary mt-1">Track guest requests and monitor SLA compliance</p>
                </div>
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                    New Request
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-5 p-6 backdrop-blur-xl bg-surface/60 border-white/[0.08] hover:border-blue-500/30 transition-colors group">
                    <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl group-hover:bg-blue-500/20 transition-colors shadow-lg shadow-blue-500/5">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-text-tertiary text-xs font-bold uppercase tracking-wider mb-1">Avg Response Time</p>
                        <p className="text-3xl font-bold text-text-primary">12m</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-5 p-6 backdrop-blur-xl bg-surface/60 border-white/[0.08] hover:border-emerald-500/30 transition-colors group">
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:bg-emerald-500/20 transition-colors shadow-lg shadow-emerald-500/5">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-text-tertiary text-xs font-bold uppercase tracking-wider mb-1">Completed Today</p>
                        <p className="text-3xl font-bold text-text-primary">24</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-5 p-6 backdrop-blur-xl bg-surface/60 border-white/[0.08] hover:border-rose-500/30 transition-colors group">
                    <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl group-hover:bg-rose-500/20 transition-colors shadow-lg shadow-rose-500/5">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-text-tertiary text-xs font-bold uppercase tracking-wider mb-1">SLA Breaches</p>
                        <p className="text-3xl font-bold text-text-primary">3</p>
                    </div>
                </Card>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center p-12 text-text-secondary animate-pulse">Loading requests...</div>
                ) : (
                    requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl">
                            <CheckCircle2 className="w-12 h-12 text-text-tertiary mb-4 opacity-30" />
                            <p className="text-text-secondary font-semibold">No active service requests</p>
                            <p className="text-text-tertiary text-sm mt-1">All caught up! Click "New Request" to create one.</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => req.status === 'PENDING' ? setSelectedRequest(req) : null}
                                className={`relative overflow-hidden backdrop-blur-xl rounded-2xl p-0.5 transition-all hover:scale-[1.01] hover:shadow-2xl cursor-pointer group ${getSLAColor(req).includes('danger') ? 'bg-gradient-to-r from-rose-500/50 to-orange-500/50' :
                                    getSLAColor(req).includes('warning') ? 'bg-gradient-to-r from-amber-500/50 to-yellow-500/50' :
                                        'bg-gradient-to-r from-white/[0.08] to-white/[0.04]'
                                    }`}
                            >
                                <div className="bg-surface/90 h-full w-full rounded-[14px] p-5 flex items-center justify-between backdrop-blur-xl">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-surface-light border border-white/[0.05] flex items-center justify-center font-bold text-xl shadow-inner text-text-secondary">
                                            {req.room}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-lg text-text-primary capitalize">{req.type.replace('_', ' ')}</h3>
                                                <Badge variant={req.status === 'PENDING' ? 'warning' : req.status === 'OVERDUE' ? 'danger' : req.status === 'COMPLETED' ? 'success' : 'info'}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-text-secondary mt-1 font-medium">{req.title || 'Service Request'}</p>
                                            <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                                                Guest: {req.guest} • Assigned: {req.assignedTo?.user?.name || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {(req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS') && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateStatus(req.id, 'COMPLETED');
                                                }}
                                            >
                                                Complete
                                            </Button>
                                        )}
                                        {req.status === 'ACCEPTED' && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateStatus(req.id, 'IN_PROGRESS');
                                                }}
                                            >
                                                Start
                                            </Button>
                                        )}

                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1">Elapsed Time</p>
                                            <p className={`text-3xl font-mono font-bold ${getSLAColor(req).includes('danger') ? 'text-rose-400' :
                                                getSLAColor(req).includes('warning') ? 'text-amber-400' : 'text-text-primary'
                                                }`}>
                                                {elapsedTimes[req.id] || '0m'}
                                            </p>
                                            <p className="text-xs text-text-tertiary opacity-70 mt-1">Target SLA: {req.slaLimit}m</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* New Request Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Create Service Request"
                description="Manually log a request for a room"
            >
                <form onSubmit={handleNewRequest} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Request Type"
                            value={newRequestData.type}
                            onChange={e => setNewRequestData({ ...newRequestData, type: e.target.value })}
                            options={[
                                { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                                { value: 'FOOD_ORDER', label: 'Food & Beverage' },
                                { value: 'MAINTENANCE', label: 'Maintenance' },
                                { value: 'CONCIERGE', label: 'Concierge' },
                            ]}
                        />
                        <Select
                            label="Room Number"
                            value={newRequestData.roomNumber}
                            onChange={e => setNewRequestData({ ...newRequestData, roomNumber: e.target.value })}
                            options={[
                                { value: '', label: 'Select room...' },
                                ...rooms.map(r => ({ value: r.roomNumber, label: r.roomNumber }))
                            ]}
                        />
                    </div>
                    <Input
                        label="Request Title"
                        placeholder="e.g. Extra pillows, AC not working"
                        value={newRequestData.title}
                        onChange={e => setNewRequestData({ ...newRequestData, title: e.target.value })}
                        required
                    />
                    <Select
                        label="Priority"
                        value={newRequestData.priority}
                        onChange={e => setNewRequestData({ ...newRequestData, priority: e.target.value })}
                        options={[
                            { value: 'NORMAL', label: 'Normal' },
                            { value: 'HIGH', label: 'High' },
                            { value: 'URGENT', label: 'Urgent' },
                        ]}
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={isSubmitting}>Create Request</Button>
                    </div>
                </form>
            </Modal>

            {/* Assignment Modal */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Assign Service Request"
                description={`Assign Room ${selectedRequest?.room}'s ${selectedRequest?.type} request to a staff member`}
            >
                <div className="space-y-4 pt-4">
                    <Select
                        label="Select Staff Member"
                        value={assignmentId}
                        onChange={e => setAssignmentId(e.target.value)}
                        options={[
                            { value: '', label: 'Select staff member...' },
                            ...staffList.map(s => ({
                                value: s.id,
                                label: `${s.name} (${s.department})`
                            }))
                        ]}
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                        <Button variant="primary" loading={isAssigning} onClick={handleAssign} disabled={!assignmentId}>
                            Confirm Assignment
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
