import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
    tenantId: z.string().min(1),
    login: z.string().min(3) // email ou telefone
})

export async function POST(req: NextRequest) {
    try {
        const body = await schema.parseAsync(await req.json())
        const { tenantId, login } = body
        const isEmail = login.includes('@')
        const client = await prisma.client.findFirst({
            where: { tenantId, OR: isEmail ? [{ email: login }] : [{ phone: login }] },
            select: { id: true }
        })
        // Aqui enviaríamos um email/SMS com token; por ora, no-op
        return NextResponse.json({ ok: true })
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? 'invalid' }, { status: 400 })
    }
}


