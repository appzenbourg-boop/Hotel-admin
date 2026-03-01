'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Building2, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

export default function AdminRegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        hotelName: '',
        hotelAddress: ''
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Register User & Property
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    role: 'HOTEL_ADMIN'
                })
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Registration failed')
                setLoading(false)
                return
            }

            // 2. Auto Login
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (result?.ok) {
                toast.success('Registration successful! Welcome to Zenbourg.')
                router.push('/admin/dashboard')
            } else {
                toast.error('Registration successful, but login failed. Please sign in manually.')
                router.push('/admin/login')
            }

        } catch (error) {
            console.error(error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image/Branding (Same as Login) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/5 opacity-50" />
                <div className="relative z-10 flex flex-col justify-center p-12 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <Building2 className="w-10 h-10" />
                        <span className="text-3xl font-bold">Zenbourg</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">
                        Join the future of hospitality.
                    </h1>
                    <p className="text-lg text-white/90 mb-8">
                        Create your hotel account today and start streamlining your operations.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">✓</div>
                            <div>
                                <h3 className="font-semibold">Instant Setup</h3>
                                <p className="text-sm text-white/80">Get your property running in minutes</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">✓</div>
                            <div>
                                <h3 className="font-semibold">Full Control</h3>
                                <p className="text-sm text-white/80">Manage staff, rooms, and guests</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md my-auto">
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-text-primary mb-2">
                            Create Account
                        </h2>
                        <p className="text-text-secondary">
                            Register your hotel to get started.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Personal Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                required
                            />
                            <Input
                                label="Phone"
                                placeholder="+91..."
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                required
                            />
                        </div>

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="owner@hotel.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                        />

                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            required
                            rightIcon={
                                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />

                        <div className="border-t border-border my-4 pt-4">
                            <h3 className="text-sm font-semibold text-text-primary mb-3">Property Details</h3>

                            <Input
                                label="Hotel Name"
                                placeholder="Grand Hotel"
                                value={formData.hotelName}
                                onChange={(e) => handleChange('hotelName', e.target.value)}
                                required
                                className="mb-4"
                            />

                            <Input
                                label="Address"
                                placeholder="Street, City, Country"
                                value={formData.hotelAddress}
                                onChange={(e) => handleChange('hotelAddress', e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full mt-2"
                            loading={loading}
                        >
                            Create Hotel Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-text-secondary">
                            Already have an account?{' '}
                            <Link href="/admin/login" className="text-primary hover:text-primary-hover font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
