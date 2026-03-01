import Link from 'next/link'
import { Building2, UserCog, User, ShieldCheck } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />

      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-xl">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Zenbourg
          </h1>
        </div>
        <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
          The all-in-one operations platform for modern hotels. <br />
          Orchestrate <span className="text-primary font-medium">Excellence</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
        {/* Admin Portal Card */}
        <Link
          href="/admin/login"
          className="group relative overflow-hidden backdrop-blur-xl bg-surface/40 border border-white/[0.08] p-10 rounded-3xl transition-all duration-300 hover:bg-surface/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Management Portal</h2>
            <p className="text-text-secondary mb-10 leading-relaxed text-lg">
              Unified command center for Owners, Managers, and Receptionists to handle bookings, arrivals, and property operations.
            </p>
            <span className="flex items-center gap-2 text-blue-400 font-semibold group-hover:translate-x-2 transition-transform text-lg">
              Management Login <span className="text-2xl">&rarr;</span>
            </span>
          </div>
        </Link>

        {/* Staff Portal Card */}
        <Link
          href="/staff/login"
          className="group relative overflow-hidden backdrop-blur-xl bg-surface/40 border border-white/[0.08] p-10 rounded-3xl transition-all duration-300 hover:bg-surface/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <UserCog className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Staff Panel</h2>
            <p className="text-text-secondary mb-10 leading-relaxed text-lg">
              Mobile-optimized dashboard for Housekeeping, Maintenance, and Room Service teams to manage assigned tasks.
            </p>
            <span className="flex items-center gap-2 text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform text-lg">
              Staff Login <span className="text-2xl">&rarr;</span>
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-16 text-center text-gray-400 text-sm">
        <p>&copy; 2026 Zenbourg Hotel Systems. All rights reserved.</p>
      </div>
    </div>
  )
}
