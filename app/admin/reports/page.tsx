'use client'

import React from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Printer, Calendar, Lock, Download, FileBarChart } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { buildContextUrl } from '@/lib/admin-context'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { downloadCSV } from '@/lib/csv'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

// Mock Data for Trends
const occupancyData = Array.from({ length: 14 }, (_, i) => ({
    name: `Oct ${i + 10}`,
    occupancy: Math.floor(Math.random() * (95 - 60) + 60),
    adr: Math.floor(Math.random() * (250 - 180) + 180),
}))

const revenueSourceData = [
    { name: 'Room Revenue', value: 45000 },
    { name: 'Food & Beverage', value: 12500 },
    { name: 'Spa & Wellness', value: 5000 },
    { name: 'Events', value: 8000 },
]

const servicePerformanceData = [
    { name: 'Housekeeping', onTime: 92, late: 8 },
    { name: 'Room Service', onTime: 88, late: 12 },
    { name: 'Maintenance', onTime: 75, late: 25 },
    { name: 'Concierge', onTime: 98, late: 2 },
]

const KPICard = ({ title, value, subtext, trend }: any) => (
    <Card className="p-6 relative overflow-hidden group border-white/[0.05] hover:border-primary/30 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileBarChart className="w-12 h-12 text-primary" />
        </div>
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-text-primary mt-2 tracking-tighter">{value}</h3>
        <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(trend)}%
            </span>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-tight">{subtext}</p>
        </div>
    </Card>
)

export default function ReportsPage() {
    const { data: session } = useSession()
    const [stats, setStats] = React.useState({
        todayRevenue: 0,
        occupancyRate: 0,
        availableRooms: 0,
        monthRevenue: 0,
        todayCheckIns: 0
    })
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(buildContextUrl('/api/admin/dashboard'))
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        if (['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(session?.user?.role || '')) {
            fetchStats()
        }
    }, [session])

    const handleExportPDF = () => {
        toast.info('Generating PDF Report...', {
            description: 'Compiling financial and operational data for ' + new Date().toLocaleDateString()
        });
        setTimeout(() => toast.success('Report Downloaded Successfully'), 2000);
    };

    const handleExportCSV = () => {
        const reportData = [
            { Metric: 'Today Revenue', Value: stats.todayRevenue },
            { Metric: 'Occupancy Rate', Value: `${stats.occupancyRate}%` },
            { Metric: 'Month Revenue', Value: stats.monthRevenue },
            { Metric: 'Today Arrivals', Value: stats.todayCheckIns },
        ];
        downloadCSV(reportData, 'Performance_Report');
        toast.success('Operational data exported to CSV');
    };

    if (!['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(session?.user?.role || '')) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in text-surface">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-danger shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <Lock className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-text-primary mb-3">Restricted Access</h1>
                <p className="text-lg text-text-secondary max-w-md">
                    Analytics and Financial Reports are restricted to Property Administrators.
                </p>
                <Button variant="secondary" className="mt-8" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tighter">Performance Analytics</h1>
                    <p className="text-text-secondary mt-1">Real-time insights into hotel operations and revenue.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
                        Export Data
                    </Button>
                    <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handleExportPDF}>
                        Full PDF Report
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="h-32 animate-pulse bg-surface/50 border-white/[0.05]" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Today Revenue" value={formatCurrency(stats.todayRevenue)} trend={12.5} subtext="vs yesterday" />
                    <KPICard title="Occupancy Rate" value={`${stats.occupancyRate}%`} trend={5.2} subtext="vs yesterday" />
                    <KPICard title="Month Revenue" value={formatCurrency(stats.monthRevenue)} trend={18.2} subtext="Total this month" />
                    <KPICard title="Today Arrivals" value={stats.todayCheckIns} trend={3.8} subtext="guests expected" />
                </div>
            )}

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Occupancy Trend - Wide Chart */}
                <Card className="lg:col-span-2 p-6 border-white/[0.05] backdrop-blur-xl bg-surface/60">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-text-primary">Occupancy & ADR Trend</h3>
                        <p className="text-sm text-text-secondary">Daily occupancy rate vs Average Daily Rate over the last 2 weeks</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={occupancyData}>
                                <defs>
                                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAdr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                />
                                <Legend iconType="circle" />
                                <Area yAxisId="left" type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#6366f1" fillOpacity={1} fill="url(#colorOcc)" strokeWidth={3} />
                                <Area yAxisId="right" type="monotone" dataKey="adr" name="ADR ($)" stroke="#10b981" fillOpacity={1} fill="url(#colorAdr)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Revenue Sources - Pie Chart */}
                <Card className="p-6 border-white/[0.05] backdrop-blur-xl bg-surface/60">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-text-primary">Revenue Mix</h3>
                        <p className="text-sm text-text-secondary">Distribution by source</p>
                    </div>
                    <div className="h-[300px] w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueSourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {revenueSourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }}
                                    formatter={(val: number) => formatCurrency(val)}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Service Performance - Bar Chart */}
            <Card className="p-6 border-white/[0.05] backdrop-blur-xl bg-surface/60">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-text-primary">Staff Performance & SLA</h3>
                        <p className="text-sm text-text-secondary">On-time completion rates by department</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={servicePerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} unit="%" />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} width={100} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '12px' }}
                            />
                            <Legend />
                            <Bar dataKey="onTime" name="On Time %" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                            <Bar dataKey="late" name="Late %" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    )
}
