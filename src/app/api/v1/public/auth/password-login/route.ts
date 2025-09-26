import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const schema = z.object({
    tenantId: z.string().min(1),
    login: z.string().min(3), // email ou telefone
    password: z.string().min(6)
})

export async function POST(req: NextRequest) {
    try {
        const body = await schema.parseAsync(await req.json())
        const { tenantId, login, password } = body
        const isEmail = login.includes('@')

        const client = await prisma.client.findFirst({
            where: {
                tenantId,
                OR: isEmail ? [{ email: login }] : [{ phone: login }]
            }
        })

        if (!client || !client.passwordHash) {
            return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 })
        }

        const ok = await bcrypt.compare(password, client.passwordHash)
        if (!ok) return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 })

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) return NextResponse.json({ ok: false, error: 'server_misconfig' }, { status: 500 })
        const token = jwt.sign({ clientId: client.id, tenantId }, jwtSecret, { expiresIn: '30d' })
        const res = NextResponse.json({ ok: true, client: { id: client.id, name: client.name, email: client.email, phone: client.phone } })
        res.cookies.set('client-auth', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
        })
        return res
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? 'invalid' }, { status: 400 })
    }
}


