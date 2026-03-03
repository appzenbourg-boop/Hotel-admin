import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const { searchParams } = new URL(request.url)
        const queryPropertyId = searchParams.get('propertyId')
        const statusFilter = searchParams.get('status') // optional: ALL, PENDING, etc.

        const where: any = {}

        // SUPER_ADMIN has no propertyId on session — they can see all or filter by query param
        if (session.user.role === 'SUPER_ADMIN') {
            if (queryPropertyId && queryPropertyId !== 'ALL') {
                where.propertyId = queryPropertyId
            }
            // else: no filter — show all properties
        } else {
            const propertyId = session.user.propertyId
            if (!propertyId) return new NextResponse('Unauthorized', { status: 401 })
            where.propertyId = propertyId
        }

        // Status filter — default: hide only COMPLETED
        if (statusFilter && statusFilter !== 'ALL') {
            where.status = statusFilter
        } else {
            where.status = { not: 'COMPLETED' }
        }

        const services = await prisma.serviceRequest.findMany({
            where,
            include: {
                room: { select: { roomNumber: true } },
                guest: { select: { name: true } },
                assignedTo: {
                    include: { user: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const formatted = services.map(s => ({
            id: s.id,
            room: s.room?.roomNumber || 'N/A',
            guest: s.guest?.name || 'Unknown',
            type: s.type,
            title: s.title,
            description: s.description,
            priority: s.priority,
            status: s.status,
            assignedTo: s.assignedTo,
            requestTime: s.createdAt,
            slaLimit: s.slaMinutes
        }))

        return NextResponse.json(formatted)

    } catch (error: any) {
        console.error('[SERVICE_GET_ERROR]', error?.message || error)
        return new NextResponse(error?.message || 'Internal Server Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const body = await request.json()
        const { roomId, type, title, description, priority = 'NORMAL' } = body

        if (!roomId) return new NextResponse('roomId is required', { status: 400 })
        if (!title) return new NextResponse('title is required', { status: 400 })

        // Check if room is occupied to link the guest AND get the propertyId from room
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

        // For SUPER_ADMIN, propertyId may be null on session — derive it from the room
        const propertyId = session.user.propertyId || room.propertyId

        if (!propertyId) return new NextResponse('Cannot determine property', { status: 400 })

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
                slaMinutes: type === 'MAINTENANCE' ? 60 : 30
            }
        })

        return NextResponse.json(serviceRequest)
    } catch (error: any) {
        console.error('[SERVICE_POST_ERROR]', error?.message || error)
        return new NextResponse(error?.message || 'Internal Server Error', { status: 500 })
    }
}
