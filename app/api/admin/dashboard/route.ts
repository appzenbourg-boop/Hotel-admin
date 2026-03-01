import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { startOfDay, endOfDay } from 'date-fns'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/dashboard
 * Get high-level stats for the dashboard
 */
export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAuth(req, ['SUPER_ADMIN', 'HOTEL_ADMIN'])
        if (authResult instanceof NextResponse) return authResult

        const { searchParams } = new URL(req.url)
        const queryPropertyId = searchParams.get('propertyId')
        const session = await getServerSession(authOptions)

        let whereProperty: any = {}
        if (session?.user?.role === 'SUPER_ADMIN') {
            if (queryPropertyId && queryPropertyId !== 'ALL') {
                whereProperty = { propertyId: queryPropertyId }
            }
        } else {
            const propertyId = session?.user?.propertyId
            if (propertyId) whereProperty = { propertyId }
        }

        const today = new Date()

        // 1. Occupancy Stats
        const totalRooms = await prisma.room.count({ where: whereProperty })
        const occupiedRooms = await prisma.room.count({
            where: { ...whereProperty, status: 'OCCUPIED' }
        })

        // 2. Today's Arrivals & Departures
        const todayArrivals = await prisma.booking.count({
            where: {
                ...whereProperty,
                checkIn: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                },
                status: 'RESERVED'
            }
        })

        const todayDepartures = await prisma.booking.count({
            where: {
                ...whereProperty,
                checkOut: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                },
                status: 'CHECKED_IN'
            }
        })

        // 3. Service Request Status
        const pendingServices = await prisma.serviceRequest.count({
            where: { ...whereProperty, status: 'PENDING' }
        })

        const activeServices = await prisma.serviceRequest.count({
            where: { ...whereProperty, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } }
        })

        // 4. Revenue (Monthly)
        const currentMonth = today.getMonth() + 1
        const currentYear = today.getFullYear()

        const revenueData = await prisma.booking.aggregate({
            where: {
                ...whereProperty,
                status: 'CHECKED_OUT',
                updatedAt: {
                    gte: new Date(currentYear, currentMonth - 1, 1),
                }
            },
            _sum: {
                totalAmount: true
            }
        })

        // 5. Active Attendance/Staff On-Duty
        // Note: Staff model has propertyId
        const activeAttendance = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                },
                punchOut: null,
                staff: whereProperty // This works if whereProperty is { propertyId: ... } or {}
            },
            include: {
                staff: {
                    include: { user: { select: { name: true } } }
                }
            }
        })

        // 6. Recent Arrivals
        const recentArrivals = await prisma.booking.findMany({
            where: {
                ...whereProperty,
                checkIn: { gte: startOfDay(today), lte: endOfDay(today) }
            },
            include: {
                guest: { select: { name: true } },
                room: { select: { roomNumber: true } }
            },
            take: 5,
            orderBy: { checkIn: 'desc' }
        })

        // 7. Recent Departures
        const recentDepartures = await prisma.booking.findMany({
            where: {
                ...whereProperty,
                checkOut: { gte: startOfDay(today), lte: endOfDay(today) },
                status: 'CHECKED_IN'
            },
            include: {
                guest: { select: { name: true } },
                room: { select: { roomNumber: true } }
            },
            take: 5,
            orderBy: { checkOut: 'asc' }
        })

        // 8. Active Housekeeping/Tasks
        const activeTasks = await prisma.serviceRequest.findMany({
            where: { ...whereProperty, status: 'PENDING' },
            include: {
                room: { select: { roomNumber: true } }
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        })

        // 9. Recent Deliveries/Activities for the log
        const recentActivity = await prisma.serviceRequest.findMany({
            where: {
                ...whereProperty,
                updatedAt: { gte: startOfDay(today) },
                status: 'COMPLETED'
            },
            include: { room: { select: { roomNumber: true } } },
            take: 5,
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({
            todayCheckIns: todayArrivals,
            todayCheckOuts: todayDepartures,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            availableRooms: totalRooms - occupiedRooms,
            pendingHousekeeping: pendingServices,
            activeFoodOrders: activeServices,
            slaBreaches: 0,
            onDutyStaff: activeAttendance.length,
            onDutyStaffNames: activeAttendance.map((a: any) => a.staff.user.name),
            todayRevenue: revenueData._sum.totalAmount || 0,
            monthRevenue: revenueData._sum.totalAmount || 0, // Placeholder
            recentCheckIns: recentArrivals.map((b: any) => ({
                id: b.id,
                guest: b.guest.name,
                room: b.room.roomNumber,
                status: b.status
            })),
            recentDepartures: recentDepartures.map((b: any) => ({
                id: b.id,
                guest: b.guest.name,
                room: b.room.roomNumber,
                status: b.status
            })),
            housekeepingTasks: activeTasks.map((t: any) => ({
                id: t.id,
                room: t.room?.roomNumber || '?',
                type: t.type,
                title: t.title
            })),
            activityLog: recentActivity.map((a: any) => ({
                time: "Recently", // Simplified for now since formatRelativeTime needs to be shared correctly
                action: `${a.type.replace('_', ' ')} completed`,
                room: a.room?.roomNumber || '?'
            }))
        })

    } catch (error: any) {
        console.error('[DASHBOARD_STATS_ERROR]', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
