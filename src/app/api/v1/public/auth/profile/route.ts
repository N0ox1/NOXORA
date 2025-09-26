import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

function getAuthClient(req: NextRequest) {
    const token = req.cookies.get('client-auth')?.value
    const jwtSecret = process.env.JWT_SECRET
    if (!token || !jwtSecret) return null
    try {
        const decoded = jwt.verify(token, jwtSecret) as any
        return { clientId: decoded.clientId as string, tenantId: decoded.tenantId as string }
    } catch {
        return null
    }
}

export async function GET(req: NextRequest) {
    const auth = getAuthClient(req)
    if (!auth) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const client = await prisma.client.findFirst({
        where: { id: auth.clientId, tenantId: auth.tenantId },
        select: { id: true, name: true, email: true, phone: true }
    })
    if (!client) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    return NextResponse.json({ ok: true, client })
}

const patchSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().min(8).optional(),
})

export async function PATCH(req: NextRequest) {
    const auth = getAuthClient(req)
    if (!auth) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    try {
        const data = await patchSchema.parseAsync(await req.json())
        const updated = await prisma.client.update({
            where: { id: auth.clientId },
            data: {
                name: data.name ?? undefined,
                email: data.email === undefined ? undefined : data.email,
                phone: data.phone ?? undefined,
            },
            select: { id: true, name: true, email: true, phone: true }
        })
        return NextResponse.json({ ok: true, client: updated })
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? 'invalid' }, { status: 400 })
    }
}


