import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit/audit';
import { getRequestMeta } from '@/lib/security/request';
import { strict, zStr } from '@/lib/validation';
import { ensureTenant } from '@/lib/http/utils';

const ClientCreateSchema = strict({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    notes: z.string().optional().transform((s) => s?.trim())
});

export async function GET(req: NextRequest) {
    try {
        const tenantId = ensureTenant(req);
        const clients = await prisma.client.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                notes: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(clients);
    } catch (err) {
        console.error('Erro ao listar clientes:', err);
        return NextResponse.json({ code: 'internal_error', message: 'Erro ao listar clientes' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const tenantId = ensureTenant(req);
        const data = await ClientCreateSchema.parseAsync(await req.json());
        const created = await prisma.client.create({ data: { tenantId, ...data } });
        const { requestId, ip } = getRequestMeta(req as any);
        await audit({ tenantId, userId: req.headers.get('x-user-id') || 'system', entity: 'client', entityId: created.id, op: 'CREATE', before: null, after: created, requestId, ip });
        return NextResponse.json({ ok: true, client: created }, { status: 201 });
    } catch (err) {
        if (err instanceof ZodError) return NextResponse.json({ code: 'validation_error', errors: err.flatten() }, { status: 422 });
        if (err instanceof NextResponse) return err;
        return NextResponse.json({ code: 'internal_error' }, { status: 500 });
    }
}
