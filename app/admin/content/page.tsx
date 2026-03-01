'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import {
    Plus, Utensils, Coffee, Edit2, Lock,
    Image as ImageIcon, Upload, X, Check,
    AlertCircle, Search, Filter, Trash2
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'
import { buildContextUrl, getAdminContext } from '@/lib/admin-context'

export default function ContentPage() {
    const { data: session } = useSession()
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [uploading, setUploading] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        category: 'Main Course',
        price: 0,
        isAvailable: true,
        isVeg: true,
        description: '',
        image: ''
    })

    const currentPropertyId = getAdminContext()?.propertyId

    const fetchMenu = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(buildContextUrl('/api/admin/content/menu'))
            const data = await res.json()
            if (data.success) {
                setMenuItems(data.menuItems || [])
            }
        } catch (error) {
            toast.error('Failed to fetch menu items')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMenu()
    }, [fetchMenu])

    const handleEdit = (item: any) => {
        setSelectedItem(item)
        setFormData({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            isAvailable: item.isAvailable,
            isVeg: item.isVeg,
            description: item.description || '',
            image: item.image || ''
        })
        setIsEditing(true)
    }

    const handleNew = () => {
        setSelectedItem(null)
        setFormData({
            id: '',
            name: '',
            category: 'Main Course',
            price: 0,
            isAvailable: true,
            isVeg: true,
            description: '',
            image: ''
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.category) {
            toast.error('Please fill required fields')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/admin/content/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    propertyId: currentPropertyId
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success(formData.id ? 'Item updated' : 'Item added')
                setIsEditing(false)
                fetchMenu()
            } else {
                toast.error(data.error || 'Failed to save')
            }
        } catch (error) {
            toast.error('Error saving menu item')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        // Simulate upload
        setTimeout(() => {
            // For demo, we just use a high-quality placeholder based on the item name or a generic one
            const mockUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`
            setFormData(prev => ({ ...prev, image: mockUrl }))
            setUploading(false)
            toast.success('Photo uploaded!')
        }, 1500)
    }

    if (!['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER'].includes(session?.user?.role || '')) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in text-white">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-danger">
                    <Lock className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-3">Restricted Access</h1>
                <p className="text-lg text-text-secondary max-w-md">
                    Content Management is restricted to Property Administrators.
                </p>
                <Button variant="secondary" className="mt-8" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        )
    }

    const stats = {
        total: menuItems.length,
        available: menuItems.filter(i => i.isAvailable).length,
        categories: Array.from(new Set(menuItems.map(i => i.category))).length,
        unAvailable: menuItems.filter(i => !i.isAvailable).length
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Hotel Content</h1>
                    <p className="text-sm text-text-secondary">Manage restaurant menu, photos, and property assets</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
                        Categories
                    </Button>
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={handleNew}>
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-primary" />
                                Restaurant Menu
                            </h2>
                            <div className="flex items-center bg-surface-light border border-border rounded-lg px-3 py-1.5 min-w-[300px]">
                                <Search className="w-4 h-4 text-text-tertiary mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    className="bg-transparent text-sm text-text-primary outline-none w-full"
                                />
                            </div>
                        </div>

                        {loading && !menuItems.length ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-text-secondary">Loading hotel menu...</p>
                            </div>
                        ) : menuItems.length === 0 ? (
                            <div className="py-20 text-center bg-surface-light/30 rounded-2xl border border-dashed border-border">
                                <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                                    <Utensils className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-medium text-text-primary">No Menu Items Found</h3>
                                <p className="text-sm text-text-secondary mb-6">Start building your restaurant menu by adding your first item.</p>
                                <Button variant="primary" onClick={handleNew}>Add Your First Item</Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {menuItems.map(item => (
                                    <div key={item.id} className="py-4 flex items-center justify-between group hover:bg-surface-light/30 px-4 -mx-4 rounded-xl transition-colors">
                                        <div className="flex items-center gap-4">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-xl object-cover shadow-lg"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-surface-light rounded-xl flex items-center justify-center text-text-tertiary border border-border">
                                                    <Coffee className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-text-primary">{item.name}</h3>
                                                    {item.isVeg && (
                                                        <div className="w-3 h-3 border border-green-600 flex items-center justify-center rounded-[2px] p-[1px]">
                                                            <div className="w-full h-full bg-green-600 rounded-full" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-secondary">{item.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-bold text-lg text-text-primary">${item.price}</span>
                                            <Badge variant={item.isAvailable ? 'success' : 'danger'}>
                                                {item.isAvailable ? 'Available' : 'Sold Out'}
                                            </Badge>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2.5 bg-surface-light hover:bg-primary/20 hover:text-primary rounded-full text-text-secondary transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-4">
                        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            Quick Stats
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-surface-light/50 rounded-lg">
                                <span className="text-text-secondary text-sm">Total Items</span>
                                <span className="font-bold text-text-primary">{stats.total}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-surface-light/50 rounded-lg">
                                <span className="text-text-secondary text-sm">Active & Listed</span>
                                <span className="font-bold text-green-500">{stats.available}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-surface-light/50 rounded-lg">
                                <span className="text-text-secondary text-sm">Categories</span>
                                <span className="font-bold text-primary">{stats.categories}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-surface-light/50 rounded-lg">
                                <span className="text-text-secondary text-sm">Out of Season</span>
                                <span className="font-bold text-danger">{stats.unAvailable}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-primary/5 border-primary/20 overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="font-bold text-primary mb-2">Guest Digital Menu</h3>
                            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                                Curate a premium experience. Menu items updated here are instantly pushed to Guest Mobile Apps.
                            </p>
                            <Button variant="primary" className="w-full text-xs shadow-lg shadow-primary/20">Preview Storefront</Button>
                        </div>
                        <Utensils className="absolute -bottom-4 -right-4 w-24 h-24 text-primary opacity-5 rotate-12" />
                    </Card>
                </div>
            </div>

            {/* Edit / New Modal */}
            <Modal
                isOpen={isEditing}
                onClose={() => !loading && setIsEditing(false)}
                title={selectedItem ? 'Edit Item' : 'New Menu Item'}
                description="Update pricing, content, and high-quality photography."
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave} loading={loading}>
                            {selectedItem ? 'Save Changes' : 'Create Item'}
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Photo */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-text-secondary uppercase tracking-widest">Photography</label>
                        <div className="relative group aspect-square rounded-2xl overflow-hidden bg-surface-light border border-dashed border-border flex flex-col items-center justify-center transition-all hover:border-primary/50">
                            {formData.image ? (
                                <>
                                    <Image
                                        src={formData.image}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <label className="p-2 bg-white rounded-full cursor-pointer hover:scale-110 transition-transform text-slate-900">
                                            <Upload className="w-4 h-4" />
                                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                        </label>
                                        <button
                                            onClick={() => setFormData({ ...formData, image: '' })}
                                            className="p-2 bg-white rounded-full hover:scale-110 transition-transform text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center p-6 text-center group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                                        {uploading ? <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" /> : <ImageIcon className="w-6 h-6" />}
                                    </div>
                                    <p className="text-sm font-medium text-text-primary">Click to upload photo</p>
                                    <p className="text-xs text-text-tertiary mt-1">High-quality JPG or PNG (Max 5MB)</p>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-text-tertiary italic text-center">
                            Pro-tip: Bright, well-lit photos increase guest orders by up to 30%.
                        </p>
                    </div>

                    {/* Right Side: Details */}
                    <div className="space-y-4">
                        <Input
                            label="Item Name"
                            placeholder="e.g. Zenbourg Signature Burger"
                            value={formData.name}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Category</label>
                                <select
                                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Appetizer">Appetizer</option>
                                    <option value="Main Course">Main Course</option>
                                    <option value="Dessert">Dessert</option>
                                    <option value="Beverage">Beverage</option>
                                    <option value="Breakfast">Breakfast</option>
                                </select>
                            </div>
                            <Input
                                label="Price ($)"
                                type="number"
                                value={formData.price}
                                onChange={(e: any) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Description</label>
                            <textarea
                                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                                placeholder="Brief description of the dish and ingredients..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border border-border flex items-center justify-center transition-colors ${formData.isVeg ? 'bg-green-500 border-green-500' : 'bg-surface-light group-hover:border-primary'}`}>
                                    {formData.isVeg && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.isVeg}
                                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                                />
                                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Vegetarian</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border border-border flex items-center justify-center transition-colors ${formData.isAvailable ? 'bg-primary border-primary' : 'bg-surface-light group-hover:border-primary'}`}>
                                    {formData.isAvailable && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.isAvailable}
                                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                />
                                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">In Stock</span>
                            </label>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
