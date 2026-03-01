import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    const allowedRoles = ['STAFF', 'MANAGER', 'RECEPTIONIST', 'HOTEL_ADMIN', 'SUPER_ADMIN']
    if (!session || !allowedRoles.includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        // 1. Get Staff Profile
        // 1. Get Staff Profile - for managers/admins, just get their user data if no staff profile exists
        let staff = await prisma.staff.findUnique({
            where: { userId: session.user.id }
        })

        if (!staff && ['MANAGER', 'HOTEL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            // Create a temporary mock staff object for managers/admins to view the portal
            staff = {
                id: 'admin-view',
                userId: session.user.id,
                department: 'ADMINISTRATION',
                designation: session.user.role,
                employeeId: 'ADMIN',
                status: 'ACTIVE'
            } as any
        }

        if (!staff) {
            return new NextResponse('Staff Profile Not Found', { status: 404 })
        }

        // 2. Get Today's Attendance
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const attendance = await prisma.attendance.findFirst({
            where: {
                staffId: staff.id,
                date: today
            }
        })

        // 3. Get Assigned Tasks (Pending/In Progress)
        const tasks = await prisma.serviceRequest.findMany({
            where: {
                assignedToId: staff.id,
                status: {
                    in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS']
                }
            },
            orderBy: { priority: 'desc' }
        })

        return NextResponse.json({
            profile: staff,
            attendance: attendance,
            tasks: tasks
        })

    } catch (error) {
        console.error("Staff Me API Error:", error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
