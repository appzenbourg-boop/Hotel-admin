'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import {
    Save, UserCog, Bell, Building2, CreditCard,
    Shield, LayoutDashboard, Bed,
    Users, DollarSign, Calendar, Settings as SettingsIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { buildContextUrl, getAdminContext } from '@/lib/admin-context'

const MODULES = [
    { id: 'dashboard', label: 'Dashboard Assets', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms & Bookings', icon: Bed },
    { id: 'staff', label: 'Staff Directory', icon: Users },
    { id: 'payroll', label: 'Financials & Payroll', icon: DollarSign },
    { id: 'attendance', label: 'Attendance Tracking', icon: Calendar },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
]

const PERMISSION_LEVELS = [
    { id: 'NONE', label: 'No Access', color: 'bg-red-500/10 text-red-500' },
    { id: 'READ', label: 'Read Only', color: 'bg-blue-500/10 text-blue-500' },
    { id: 'READ_WRITE', label: 'Full Access', color: 'bg-green-500/10 text-green-500' },
]

export default function SettingsPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState('GENERAL')
    const [isSaving, setIsSaving] = useState(false)
    const [roles, setRoles] = useState<any[]>([])
    const [editingRole, setEditingRole] = useState<any>(null)
    const [tempPermissions, setTempPermissions] = useState<any>({})

    const adminContext = getAdminContext()
    const currentPropertyId = adminContext?.propertyId

    const tabs = [
        { id: 'GENERAL', label: 'General', icon: Building2 },
        { id: 'ROLES', label: 'Roles & Permissions', icon: UserCog },
        { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
        { id: 'PAYMENTS', label: 'Payments', icon: CreditCard },
    ]

    const fetchRoles = useCallback(async () => {
        try {
            const res = await fetch(buildContextUrl('/api/admin/settings/roles'))
            const data = await res.json()
            if (data.success) {
                setRoles(data.rolePermissions || [])
            }
        } catch (error) {
            console.error('Failed to fetch roles')
        }
    }, [])

    useEffect(() => {
        if (activeTab === 'ROLES') {
            fetchRoles()
        }
    }, [activeTab, fetchRoles])

    const handleSaveGeneral = () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            toast.success('General settings updated successfully')
        }, 800)
    }

    const openEditPermissions = (roleType: string) => {
        const existing = roles.find(r => r.role === roleType)
        setEditingRole(roleType)
        setTempPermissions(existing?.permissions || {})
    }

    const saveRolePermissions = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/admin/settings/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: currentPropertyId,
                    role: editingRole,
                    permissions: tempPermissions
                })
            })
            if (res.ok) {
                toast.success('Permissions updated successfully')
                setEditingRole(null)
                fetchRoles()
            }
        } catch (error) {
            toast.error('Failed to update permissions')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-text-primary">System Settings</h1>
                {activeTab === 'GENERAL' && (
                    <Button
                        variant="primary"
                        leftIcon={<Save className="w-4 h-4" />}
                        loading={isSaving}
                        onClick={handleSaveGeneral}
                    >
                        Save Changes
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Nav */}
                <Card className="p-2 h-fit">
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-primary text-white'
                                    : 'text-text-secondary hover:bg-surface-light hover:text-text-primary'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </Card>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6">
                    {activeTab === 'GENERAL' && (
                        <Card>
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Hotel Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Hotel Name" defaultValue="Zenbourg Grand Hotel" />
                                <Input label="Contact Phone" defaultValue="+91 98765 43210" />
                                <Input label="Contact Email" defaultValue="info@zenbourg.com" />
                                <Input label="Website" defaultValue="https://zenbourg.com" />
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
                                    <textarea
                                        className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                                        defaultValue="123 Luxury Lane, Mumbai, Maharashtra, India"
                                    />
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'ROLES' && (
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-text-primary">Role Configuration</h2>
                                    <p className="text-sm text-text-secondary">Customize what each staff member can see and do</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { role: 'MANAGER', label: 'Property Manager', desc: 'Can manage most operations' },
                                    { role: 'RECEPTIONIST', label: 'Receptionist', desc: 'Can manage rooms and bookings' },
                                    { role: 'STAFF', label: 'Support Staff', desc: 'Daily operational tasks' },
                                ].map((roleDef) => (
                                    <div key={roleDef.role} className="flex items-center justify-between p-4 border border-border rounded-xl bg-surface-light/30 hover:bg-surface-light/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary">{roleDef.label}</p>
                                                <p className="text-xs text-text-secondary">{roleDef.desc}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openEditPermissions(roleDef.role)}
                                        >
                                            Edit Access
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {activeTab === 'NOTIFICATIONS' && (
                        <Card>
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Notification Templates</h2>
                            <div className="space-y-4">
                                <div className="p-4 border border-border rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-medium text-text-primary">Booking Confirmation (Email)</h3>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
                                    </div>
                                    <p className="text-xs text-text-secondary font-mono bg-surface-light p-2 rounded">
                                        &quot;Dear {`{guest_name}`}, your booking at Zenbourg is confirmed for {`{dates}`}...&quot;
                                    </p>
                                </div>
                                <div className="p-4 border border-border rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-medium text-text-primary">Check-in Link (SMS)</h3>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
                                    </div>
                                    <p className="text-xs text-text-secondary font-mono bg-surface-light p-2 rounded">
                                        &quot;Welcome to Zenbourg! Skip the queue and check-in online: {`{link}`}&quot;
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'PAYMENTS' && (
                        <Card>
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Payment Gateways</h2>
                            <div className="space-y-6">
                                {/* Razorpay Configuration */}
                                <div className="space-y-4 p-4 border border-border rounded-lg bg-surface-light/30">
                                    <div className="flex items-center justify-between pb-4 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm">
                                                <span className="font-bold text-blue-800">R</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-primary">Razorpay</p>
                                                <p className="text-xs text-text-secondary">Connected • Live Mode</p>
                                            </div>
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Key ID</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    value="rzp_live_xxxxxxxxxxxxxx"
                                                    disabled
                                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-secondary opacity-70"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Key Secret</label>
                                            <input
                                                type="password"
                                                value="••••••••••••••••"
                                                disabled
                                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-secondary opacity-70"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-text-tertiary italic">
                                        Note: Values are managed via server-side environment variables (.env).
                                    </p>
                                </div>

                                {/* Stripe Configuration */}
                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-surface-light/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center shadow-sm">
                                            <span className="font-bold text-slate-800">S</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-primary">Stripe</p>
                                            <p className="text-xs text-text-secondary">Connected • Test Mode</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="text-xs">Configure</Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Edit Permissions Modal */}
            <Modal
                isOpen={!!editingRole}
                onClose={() => setEditingRole(null)}
                title={`Access Control: ${editingRole}`}
                description="Define granular permissions for this role"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditingRole(null)}>Cancel</Button>
                        <Button variant="primary" onClick={saveRolePermissions} loading={isSaving}>Save Permissions</Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {MODULES.map((module) => (
                        <div key={module.id} className="flex items-center justify-between p-4 bg-surface-light/30 rounded-xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <module.icon className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-text-primary">{module.label}</span>
                            </div>

                            <div className="flex gap-2">
                                {PERMISSION_LEVELS.map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => setTempPermissions({ ...tempPermissions, [module.id]: level.id })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${tempPermissions[module.id] === level.id
                                                ? `${level.color} border-current shadow-lg scale-105`
                                                : 'border-border text-text-secondary hover:bg-surface-light'
                                            }`}
                                    >
                                        {level.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    )
}
