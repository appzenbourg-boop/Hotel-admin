import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    const allowedRoles = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (!session || !allowedRoles.includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { bookingId, action } = body // action: 'CHECK_IN' | 'CHECK_OUT' | 'CANCEL'

        let status = 'RESERVED'
        let roomStatus = 'OCCUPIED'

        if (action === 'CHECK_IN') {
            status = 'CHECKED_IN'
            roomStatus = 'OCCUPIED'
        } else if (action === 'CHECK_OUT') {
            status = 'COMPLETED'
            roomStatus = 'CLEANING'
        } else if (action === 'CANCEL') {
            status = 'CANCELLED'
            roomStatus = 'AVAILABLE'
        }

        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: status as any },
            include: { room: true }
        })

        // Also update room status
        await prisma.room.update({
            where: { id: booking.roomId },
            data: { status: roomStatus as any }
        })

        return NextResponse.json(booking)
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
