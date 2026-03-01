'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, Download, ArrowLeft, Building2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function SalarySlipPage() {
    const { id } = useParams()
    const router = useRouter()
    const [payroll, setPayroll] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSlip = async () => {
            try {
                const res = await fetch(`/api/payroll?id=${id}`)
                if (res.ok) {
                    const data = await res.json()
                    // Assuming GET /api/payroll with ID returns the single record
                    // If not, we might need a specific endpoint, but let's check current payroll API
                    setPayroll(data.payrolls[0])
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchSlip()
    }, [id])

    if (loading) return <div className="p-12 text-center text-text-secondary">Generating salary slip...</div>
    if (!payroll) return <div className="p-12 text-center text-danger">Salary slip not found.</div>

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between no-print">
                <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
                    Back to Payroll
                </Button>
                <div className="flex gap-3">
                    <Button variant="secondary" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                        Print Slip
                    </Button>
                    <Button variant="primary" leftIcon={<Download className="w-4 h-4" />}>
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Salary Slip Content */}
            <div className="bg-white text-slate-900 p-12 rounded-2xl shadow-2xl border border-slate-200 slip-printable">
                {/* Header */}
                <div className="flex justify-between items-start mb-12 border-b-2 border-slate-100 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                            <Building2 className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Zenbourg Grand</h1>
                            <p className="text-slate-500 font-medium">Employee Pay Slip • {payroll.month} {payroll.year}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt No.</p>
                        <p className="text-xl font-mono font-bold text-slate-700">ZB-PAY-{payroll.id.substring(payroll.id.length - 6).toUpperCase()}</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 border-b border-indigo-50">Employee Information</h3>
                        <div className="grid grid-cols-2 gap-y-3">
                            <span className="text-sm font-bold text-slate-400">Name</span>
                            <span className="text-sm font-bold text-slate-800">{payroll.staff.user.name}</span>

                            <span className="text-sm font-bold text-slate-400">Employee ID</span>
                            <span className="text-sm font-bold text-slate-800">{payroll.staff.employeeId || 'N/A'}</span>

                            <span className="text-sm font-bold text-slate-400">Designation</span>
                            <span className="text-sm font-bold text-slate-800">{payroll.staff.designation}</span>

                            <span className="text-sm font-bold text-slate-400">Department</span>
                            <span className="text-sm font-bold text-slate-800">{payroll.staff.department}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 border-b border-indigo-50">Payment Summary</h3>
                        <div className="grid grid-cols-2 gap-y-3">
                            <span className="text-sm font-bold text-slate-400">Pay Period</span>
                            <span className="text-sm font-bold text-slate-800">{payroll.month} {payroll.year}</span>

                            <span className="text-sm font-bold text-slate-400">Payment Status</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {payroll.status}
                            </span>

                            <span className="text-sm font-bold text-slate-400">Issue Date</span>
                            <span className="text-sm font-bold text-slate-800">{format(new Date(payroll.updatedAt), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-slate-100 rounded-xl overflow-hidden mb-12">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Earnings Description</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">Basic Salary</td>
                                <td className="px-6 py-4 text-sm font-mono font-bold text-slate-800 text-right">{formatCurrency(payroll.baseSalary)}</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">Overtime Pay (1.5x Hourly)</td>
                                <td className="px-6 py-4 text-sm font-mono font-bold text-emerald-600 text-right">+{formatCurrency(payroll.overtimePay)}</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">Performance Incentive</td>
                                <td className="px-6 py-4 text-sm font-mono font-bold text-emerald-600 text-right">+{formatCurrency(payroll.incentives || 0)}</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="px-6 py-8 text-lg font-black text-slate-900 capitalize">Net payable amount</td>
                                <td className="px-6 py-8 text-2xl font-mono font-black text-indigo-600 text-right">{formatCurrency(payroll.netSalary)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end border-t border-slate-100 pt-12">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Employer Signature</p>
                        <div className="w-48 h-12 border-b-2 border-slate-200 bg-slate-50/50 rounded-t-lg" />
                        <p className="text-xs font-bold text-slate-600">Zenbourg Grand HR Dept.</p>
                    </div>
                    <div className="text-right text-slate-400 space-y-1">
                        <p className="text-[10px] font-bold">This is a system-generated document.</p>
                        <p className="text-[10px] font-bold">No physical signature required.</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .slip-printable { box-shadow: none !important; border: none !important; width: 100% !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    )
}
