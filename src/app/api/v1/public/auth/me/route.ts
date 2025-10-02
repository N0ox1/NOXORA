import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
    try {
        // Verificar gJwt primeiro (token global do cliente)
        const gJwt = req.cookies.get('gJwt')?.value
        if (!gJwt) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) return NextResponse.json({ ok: false, error: 'server_misconfig' }, { status: 500 })

        const decoded = jwt.verify(gJwt, jwtSecret) as any
        const customerId = decoded.sub

        if (!customerId) return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 401 })

        // Buscar customer (não client)
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { id: true, name: true, email: true, phone: true }
        })

        if (!customer) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

        return NextResponse.json({ ok: true, client: customer })
    } catch (err) {
        return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 401 })
    }
}


