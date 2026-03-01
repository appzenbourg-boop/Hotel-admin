import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const propertyId = session.user.propertyId
        if (!propertyId) return new NextResponse('Unauthorized', { status: 401 })

        const services = await prisma.serviceRequest.findMany({
            where: {
                propertyId: propertyId,
                status: { not: 'COMPLETED' }
            }, // Correctly close the 'where' object
            include: {
                room: { select: { roomNumber: true } },
                guest: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        const formatted = services.map(s => ({
            id: s.id,
            room: s.room?.roomNumber || 'N/A',
            guest: s.guest?.name || 'Unknown',
            type: s.type,
            status: s.status,
            requestTime: s.createdAt,
            slaLimit: s.slaMinutes
        }))

        return NextResponse.json(formatted)

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await request.json()
        const { roomId, type, title, description, priority = 'NORMAL' } = body
        const propertyId = session.user.propertyId

        if (!propertyId) return new NextResponse('Missing Property ID', { status: 400 })

        // Check if room is occupied to link the guest
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                bookings: {
                    where: { status: 'CHECKED_IN' },
                    take: 1
                }
            }
        })

        if (!room) return new NextResponse('Room not found', { status: 404 })

        const guestId = room.bookings[0]?.guestId

        const serviceRequest = await prisma.serviceRequest.create({
            data: {
                propertyId,
                roomId,
                guestId,
                type,
                title,
                description,
                status: 'PENDING',
                priority,
                slaMinutes: type === 'MAINTENANCE' ? 60 : 30 // Example SLAs
            }
        })

        return NextResponse.json(serviceRequest)
    } catch (error) {
        console.error('[SERVICE_POST_ERROR]', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
