import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const schema = z.object({
    tenantId: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    password: z.string().min(6),
    name: z.string().optional()
}).refine((v) => !!v.email || !!v.phone, { message: 'email_or_phone_required' })

export async function POST(req: NextRequest) {
    try {
        const body = await schema.parseAsync(await req.json())
        const { tenantId, email, phone, password, name } = body

        const passwordHash = await bcrypt.hash(password, 12)

        // Se já existir cliente com mesmo email/telefone no tenant, atualiza senha
        let client = await prisma.client.findFirst({
            where: {
                tenantId,
                OR: [
                    email ? { email } : undefined,
                    phone ? { phone } : undefined,
                ].filter(Boolean) as any,
            },
        })

        if (client) {
            client = await prisma.client.update({
                where: { id: client.id },
                data: { passwordHash, name: name ?? client.name }
            })
        } else {
            client = await prisma.client.create({
                data: { tenantId, name: name ?? 'Cliente', email: email ?? null, phone: phone ?? '', passwordHash }
            })
        }

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


