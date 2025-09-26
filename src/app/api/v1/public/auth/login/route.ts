import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const schema = z.object({
    tenantId: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    name: z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
    try {
        const payload = await schema.parseAsync(await req.json())
        const { tenantId, email, phone, name } = payload

        // Buscar cliente por email/telefone; se não existir, criar
        let client = await prisma.client.findFirst({
            where: {
                tenantId,
                OR: [
                    email ? { email } : undefined,
                    phone ? { phone } : undefined,
                ].filter(Boolean) as any,
            },
        })

        if (!client) {
            client = await prisma.client.create({
                data: { tenantId, name: name || 'Cliente', email: email || null, phone: phone || '' },
            })
        }

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) return NextResponse.json({ message: 'JWT não configurado' }, { status: 500 })

        const token = jwt.sign(
            { clientId: client.id, tenantId },
            jwtSecret,
            { expiresIn: '30d' }
        )

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


