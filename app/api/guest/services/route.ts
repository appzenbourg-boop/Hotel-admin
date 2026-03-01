import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { category, item, description, priority } = body

        // In real app, we get guestId from session or token
        // For MVP demo, we attach to first guest found or just log
        const guest = await prisma.guest.findFirst()
        const guestId = guest?.id

        await prisma.serviceRequest.create({
            data: {
                title: item,
                description,
                type: category, // Assuming simple string match for now or map to enum
                priority,
                guestId: guestId,
                status: 'PENDING'
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return new NextResponse('Error', { status: 500 })
    }
}
