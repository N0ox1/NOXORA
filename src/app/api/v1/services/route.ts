import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit/audit';
import { getRequestMeta } from '@/lib/security/request';
import { strict, zStr } from '@/lib/validation';
import { ensureTenant } from '@/lib/http/utils';

const ServiceCreateSchema = strict({
    barbershopId: z.string().cuid(),
    name: z.string().min(1),
    durationMin: z.number().int().min(1),
    priceCents: z.number().int().min(0),
    isActive: z.boolean().optional()
});

export async function GET(req: NextRequest) {
    try {
        const tenantId = ensureTenant(req);
        const services = await prisma.service.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                durationMin: true,
                priceCents: true,
                isActive: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(services);
    } catch (err) {
        console.error('Erro ao listar serviços:', err);
        return NextResponse.json({ code: 'internal_error', message: 'Erro ao listar serviços' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const tenantId = ensureTenant(req);
        const data = await ServiceCreateSchema.parseAsync(await req.json());
        const created = await prisma.service.create({ data: { tenantId, ...data } });
        const { requestId, ip } = getRequestMeta(req as any);
        await audit({ tenantId, userId: req.headers.get('x-user-id') || 'system', entity: 'service', entityId: created.id, op: 'CREATE', before: null, after: created, requestId, ip });
        return NextResponse.json({ ok: true, service: created }, { status: 201 });
    } catch (err) {
        if (err instanceof ZodError) return NextResponse.json({ code: 'validation_error', errors: err.flatten() }, { status: 422 });
        if (err instanceof NextResponse) return err;
        return NextResponse.json({ code: 'internal_error' }, { status: 500 });
    }
}