'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronRight, Building2, UserCircle, Users, Mail, MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { toast } from 'sonner'

interface StaffMember {
    id: string
    user: {
        id: string
        name: string
        email: string
        role: string
        status: string
    }
}

interface Owner {
    id: string
    name: string
    email: string
    role: string
    status: string
}

interface PropertyHierarchy {
    id: string
    name: string
    address: string
    email: string
    phone: string
    description?: string
    owners: Owner[]
    staff: StaffMember[]
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<PropertyHierarchy[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedProperties, setExpandedProperties] = useState<string[]>([])

    // Add Property Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        description: ''
    })

    useEffect(() => {
        fetchHierarchy()
    }, [])

    const fetchHierarchy = async () => {
        try {
            const res = await fetch('/api/admin/properties/hierarchy')
            if (res.ok) {
                const data = await res.json()
                setProperties(data)
            } else {
                toast.error('Failed to fetch property hierarchy')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred while fetching properties')
        } finally {
            setLoading(false)
        }
    }

    const handleAddProperty = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/admin/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success('Property added successfully!')
                setIsModalOpen(false)
                setFormData({ name: '', email: '', phone: '', address: '', description: '' })
                fetchHierarchy()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to add property')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleProperty = (id: string) => {
        setExpandedProperties(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Property Portfolio</h1>
                    <p className="text-text-secondary">Manage all hotel properties and their hierarchies</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Add New Hotel
                </Button>
            </div>

            <div className="space-y-4">
                {properties.map(property => {
                    const isExpanded = expandedProperties.includes(property.id)
                    return (
                        <Card key={property.id} className="overflow-hidden border-border bg-surface p-0">
                            <div
                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-light transition-colors"
                                onClick={() => toggleProperty(property.id)}
                            >
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-primary" /> : <ChevronRight className="w-5 h-5 text-primary" />}
                                </div>
                                <Building2 className="w-6 h-6 text-primary" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{property.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {property.address}</span>
                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {property.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="gap-1">
                                        <UserCircle className="w-3 h-3" /> {property.owners.length} Owners
                                    </Badge>
                                    <Badge variant="secondary" className="gap-1">
                                        <Users className="w-3 h-3" /> {property.staff.length} Staff
                                    </Badge>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-6 bg-surface-light/30 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Owners Section */}
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                                            <UserCircle className="w-4 h-4" /> Owners & Admins
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {property.owners.map(owner => (
                                                <div key={owner.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                        {owner.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{owner.name}</p>
                                                        <p className="text-xs text-text-secondary">{owner.email}</p>
                                                        <Badge variant="secondary" className="mt-1 text-[10px] h-4">{owner.role}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Staff Section */}
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                                            <Users className="w-4 h-4" /> Staff Roster
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {property.staff.map(member => (
                                                <div key={member.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
                                                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                                                        {member.user.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{member.user.name}</p>
                                                        <p className="text-xs text-text-secondary">{member.user.email}</p>
                                                        <Badge variant="secondary" className="mt-1 text-[10px] h-4">{member.user.role}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            {property.staff.length === 0 && (
                                                <p className="text-sm text-text-tertiary col-span-full italic">No staff mapped to this property yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )
                })}

                {properties.length === 0 && (
                    <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-border">
                        <Building2 className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No properties found</h3>
                        <p className="text-text-secondary">Start by adding your first hotel property.</p>
                        <Button onClick={() => setIsModalOpen(true)} className="mt-4 gap-2">
                            <Plus className="w-4 h-4" /> Add Property
                        </Button>
                    </div>
                )}
            </div>

            {/* Add Property Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Hotel Property"
                description="Register a new hotel to the Zenbourg portfolio"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddProperty} loading={isSubmitting}>Create Property</Button>
                    </>
                )}
            >
                <form onSubmit={handleAddProperty} className="space-y-4">
                    <Input
                        label="Hotel Name"
                        placeholder="e.g. Zenbourg Grand Hotel"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Contact Email"
                            type="email"
                            placeholder="hotel@example.com"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                            label="Phone Number"
                            placeholder="+91 1234567890"
                            required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Address"
                        placeholder="Full physical address"
                        required
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                    <Textarea
                        label="Description"
                        placeholder="Brief overview of the property..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </form>
            </Modal>
        </div>
    )
}
