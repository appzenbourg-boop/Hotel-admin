import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HOTEL_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        // Accept both requestId and serviceId for compatibility
        const requestId = body.requestId || body.serviceId
        const { assignedToId, priority, status } = body

        if (!requestId) {
            return new NextResponse('requestId is required', { status: 400 })
        }

        const updateData: any = {}
        if (assignedToId) updateData.assignedToId = assignedToId
        // priority must be: LOW, NORMAL, HIGH, URGENT — 'MEDIUM' is NOT valid
        if (priority && ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
            updateData.priority = priority
        }
        if (status) {
            updateData.status = status
            if (status === 'ACCEPTED') updateData.acceptedAt = new Date()
            if (status === 'IN_PROGRESS') updateData.startedAt = new Date()
            if (status === 'COMPLETED') updateData.completedAt = new Date()
        } else if (assignedToId) {
            // Auto-set ACCEPTED when assigning without explicit status
            updateData.status = 'ACCEPTED'
            updateData.acceptedAt = new Date()
        }

        const updated = await prisma.serviceRequest.update({
            where: { id: requestId },
            data: updateData,
            include: {
                assignedTo: {
                    include: { user: { select: { name: true } } }
                }
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
