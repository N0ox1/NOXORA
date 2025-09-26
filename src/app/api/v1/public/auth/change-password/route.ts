import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

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

const schema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
})

export async function POST(req: NextRequest) {
    const auth = getAuthClient(req)
    if (!auth) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    try {
        const body = await schema.parseAsync(await req.json())
        const client = await prisma.client.findUnique({ where: { id: auth.clientId } })
        if (!client || !client.passwordHash) return NextResponse.json({ ok: false, error: 'no_password_set' }, { status: 400 })
        const ok = await bcrypt.compare(body.currentPassword, client.passwordHash)
        if (!ok) return NextResponse.json({ ok: false, error: 'invalid_password' }, { status: 401 })
        const passwordHash = await bcrypt.hash(body.newPassword, 12)
        await prisma.client.update({ where: { id: client.id }, data: { passwordHash } })
        return NextResponse.json({ ok: true })
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? 'invalid' }, { status: 400 })
    }
}


