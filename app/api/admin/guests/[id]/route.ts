import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HOTEL_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        // Check if guest has active bookings
        const activeBookings = await prisma.booking.count({
            where: {
                guestId: params.id,
                status: { in: ['RESERVED', 'CHECKED_IN'] }
            }
        })

        if (activeBookings > 0) {
            return new NextResponse('Cannot delete guest with active reservations', { status: 400 })
        }

        await prisma.guest.delete({
            where: { id: params.id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[GUEST_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
