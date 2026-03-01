'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function StaffDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [punchLoading, setPunchLoading] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/staff/me')
            if (res.status === 401) {
                router.push('/staff/login')
                return
            }
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handlePunch = async () => {
        setPunchLoading(true)
        try {
            const res = await fetch('/api/staff/attendance', { method: 'POST' })
            if (res.ok) {
                const json = await res.json()
                toast.success(json.message)
                fetchData() // Refresh state
            } else {
                toast.error('Failed to update attendance')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setPunchLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>
    if (!data) return <div className="p-8 text-center text-gray-500">Error loading profile</div>

    const isPunchedIn = data.attendance?.punchIn && !data.attendance?.punchOut
    const isPunchedOutToday = !!data.attendance?.punchOut

    return (
        <div className="p-4 space-y-6">
            {/* Punch In/Out Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <h2 className="text-lg font-semibold text-gray-800">Attendance</h2>
                <p className="text-sm text-gray-500 mb-6">{format(new Date(), 'EEEE, d MMMM')}</p>

                {!isPunchedOutToday ? (
                    <button
                        onClick={handlePunch}
                        disabled={punchLoading}
                        className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50 ${isPunchedIn ? 'border-red-500 bg-red-50 text-red-600' : 'border-green-500 bg-green-50 text-green-600'}`}
                    >
                        {punchLoading ? (
                            <span className="animate-spin text-2xl">↻</span>
                        ) : (
                            <>
                                <span className="text-3xl font-bold">{isPunchedIn ? 'OUT' : 'IN'}</span>
                                <span className="text-xs font-medium uppercase mt-1">Tap to Punch</span>
                            </>
                        )}
                    </button>
                ) : (
                    <div className="w-40 h-40 rounded-full border-4 border-gray-200 bg-gray-50 text-gray-400 flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 mb-2" />
                        <span className="text-sm font-bold">Shift Done</span>
                    </div>
                )}

                {isPunchedIn && (
                    <p className="mt-4 text-sm font-medium text-green-600 animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        You are currently ON DUTY
                    </p>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold">Assigned</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{data.tasks.length}</p>
                    <p className="text-xs text-blue-600 mt-1">Pending Tasks</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                    <p className="text-sm font-bold text-gray-900 mt-2 truncate">
                        {isPunchedIn ? 'Active' : 'Inactive'}
                    </p>
                </div>
            </div>

            {/* Task List Preview */}
            <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center justify-between">
                    <span>Priority Tasks</span>
                    <span onClick={() => router.push('/staff/tasks')} className="text-xs text-blue-600 cursor-pointer">View All</span>
                </h3>

                <div className="space-y-3">
                    {data.tasks.slice(0, 3).map((task: any) => (
                        <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.priority === 'URGENT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 line-clamp-1">{task.title}</h4>
                                <p className="text-xs text-text-secondary mt-1 line-clamp-1">{task.description || 'No description'}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data.tasks.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-4">No pending tasks.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
