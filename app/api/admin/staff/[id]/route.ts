import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const propertyId = session.user.propertyId
        const staff = await prisma.staff.findFirst({
            where: {
                id: params.id,
                ...(propertyId ? { propertyId } : {})
            },
            select: { userId: true }
        })

        if (!staff) return new NextResponse('Staff not found', { status: 404 })

        // Delete user (cascade will handle staff profile if configured, but let's be explicit if needed)
        // With MongoDB/Prisma, we usually delete the specific records
        await prisma.$transaction([
            prisma.staff.delete({ where: { id: params.id } }),
            prisma.user.delete({ where: { id: staff.userId } })
        ])

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[STAFF_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
