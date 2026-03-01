import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export async function GET() {
    const property = await prisma.property.findFirst()
    return NextResponse.json(property?.policies || {})
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role === 'GUEST') return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()

        const property = await prisma.property.findFirst()
        if (!property) {
            // Create default property if missing (should be in seed though)
            return new NextResponse('Property not found', { status: 404 })
        }

        await prisma.property.update({
            where: { id: property.id },
            data: { policies: body }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return new NextResponse('Error', { status: 500 })
    }
}
