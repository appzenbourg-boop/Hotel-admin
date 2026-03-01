'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import StatusBadge from '@/components/common/StatusBadge'

export default function StaffTasksPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [tasks, setTasks] = useState<any[]>([])

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/staff/me') // We can reuse this or make dedicated
            // Actually, /api/staff/me returns tasks in the .tasks field.
            if (res.ok) {
                const json = await res.json()
                setTasks(json.tasks)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleComplete = async (taskId: string) => {
        try {
            const res = await fetch(`/api/staff/tasks/${taskId}/complete`, { method: 'POST' })
            if (res.ok) {
                toast.success('Task marked as completed')
                fetchTasks()
            } else {
                toast.error('Failed to update task')
            }
        } catch (error) {
            toast.error('Error updating task')
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>

            <div className="space-y-4">
                {tasks.map((task: any) => (
                    <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {task.priority}
                            </div>
                            <span className="text-xs text-gray-400">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{task.description}</p>

                        {task.room && (
                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-700 font-medium">
                                <span className="bg-gray-100 px-2 py-1 rounded">Room {task.room?.roomNumber || 'N/A'}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleComplete(task.id)}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Mark Done
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {tasks.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-gray-900 font-semibold">All Caught Up!</h3>
                    <p className="text-gray-500 text-sm mt-1">No pending tasks assigned to you.</p>
                </div>
            )}
        </div>
    )
}
