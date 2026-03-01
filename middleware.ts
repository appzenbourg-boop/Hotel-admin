import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const isAuth = !!token
        const { pathname } = req.nextUrl

        const isAuthPage =
            pathname.startsWith('/admin/login') ||
            pathname.startsWith('/receptionist/login') ||
            pathname.startsWith('/staff/login')

        const getHomePath = (role: string) => {
            if (role === 'STAFF') return '/staff'
            if (['HOTEL_ADMIN', 'MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(role)) return '/admin/dashboard'
            return '/' // Fallback
        }

        // 1. Redirect authenticated users away from login pages to their specific dashboard
        if (isAuthPage && isAuth) {
            return NextResponse.redirect(new URL(getHomePath(token.role as string), req.url))
        }

        // 2. Redirect unauthenticated users to the correct login page
        if (!isAuth && !isAuthPage) {
            let loginPath = '/admin/login'
            if (pathname.startsWith('/staff')) loginPath = '/staff/login'

            return NextResponse.redirect(new URL(loginPath, req.url))
        }

        // 3. Role-based unauthorized access protection (for logged-in users)
        if (isAuth) {
            const role = token.role as string

            // If user is RECEPTIONIST/MANAGER and tries to access old /receptionist routes, send to /admin
            if (pathname.startsWith('/receptionist')) {
                return NextResponse.redirect(new URL('/admin/dashboard', req.url))
            }

            // Admin sections protection
            if (pathname.startsWith('/admin') && !isAuthPage) {
                const allowedAdminRoles = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']
                if (!allowedAdminRoles.includes(role)) {
                    return NextResponse.redirect(new URL(getHomePath(role), req.url))
                }

                // Extra protection for payroll
                if (pathname.startsWith('/admin/payroll') && !['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(role)) {
                    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
                }
            }

            // Staff portal protection
            if (pathname.startsWith('/staff') && !isAuthPage) {
                const allowedStaffRoles = ['STAFF', 'SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']
                if (!allowedStaffRoles.includes(role)) {
                    return NextResponse.redirect(new URL(getHomePath(role), req.url))
                }
            }
        }

        return null
    },
    {
        callbacks: {
            authorized: () => true,
        },
    }
)

export const config = {
    matcher: [
        '/admin/:path*',
        '/receptionist/:path*',
        '/staff/:path*',
        '/admin',
        '/receptionist',
        '/staff'
    ]
}
