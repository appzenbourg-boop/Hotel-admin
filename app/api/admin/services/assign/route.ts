import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'HOTEL_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { requestId, assignedToId, priority } = body

        const updated = await prisma.serviceRequest.update({
            where: { id: requestId },
            data: {
                assignedToId,
                status: 'ACCEPTED', // Change status to accepted when assigned
                priority: priority || 'MEDIUM'
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
