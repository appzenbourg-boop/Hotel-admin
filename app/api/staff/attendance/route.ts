import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STAFF') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const staff = await prisma.staff.findUnique({
            where: { userId: session.user.id }
        })

        if (!staff) return new NextResponse('Staff Profile Not Found', { status: 404 })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check for existing attendance
        const existing = await prisma.attendance.findFirst({
            where: {
                staffId: staff.id,
                date: today
            }
        })

        if (!existing) {
            // Punch In
            const newAttendance = await prisma.attendance.create({
                data: {
                    staffId: staff.id,
                    date: today,
                    punchIn: new Date(),
                    status: 'PRESENT',
                    punchInLocation: 'On-Site' // Mock location
                }
            })
            return NextResponse.json({ message: 'Punched In', data: newAttendance })
        } else {
            // Punch Out (if not already)
            if (existing.punchOut) {
                return new NextResponse('Already Punched Out', { status: 400 })
            }

            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    punchOut: new Date(),
                    punchOutLocation: 'On-Site'
                }
            })
            return NextResponse.json({ message: 'Punched Out', data: updated })
        }

    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
