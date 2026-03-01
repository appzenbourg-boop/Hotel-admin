import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const brands = await prisma.amenity.findMany()
        return NextResponse.json(brands)
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role === 'GUEST') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { name, icon, description, category } = body

        // For now, assume a single property or attach to the first one found
        const property = await prisma.property.findFirst()
        if (!property) {
            return new NextResponse('Property not configured', { status: 400 })
        }

        const amenity = await prisma.amenity.create({
            data: {
                name,
                icon,
                description,
                category,
                propertyId: property.id
            }
        })

        return NextResponse.json(amenity)
    } catch (error) {
        console.error('[AMENITIES_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
