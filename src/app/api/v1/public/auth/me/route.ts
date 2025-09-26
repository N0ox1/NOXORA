import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('client-auth')?.value
        if (!token) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) return NextResponse.json({ ok: false, error: 'server_misconfig' }, { status: 500 })
        const decoded = jwt.verify(token, jwtSecret) as any
        const client = await prisma.client.findFirst({
            where: { id: decoded.clientId, tenantId: decoded.tenantId },
            select: { id: true, name: true, email: true, phone: true }
        })
        if (!client) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
        return NextResponse.json({ ok: true, client })
    } catch (err) {
        return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 401 })
    }
}


