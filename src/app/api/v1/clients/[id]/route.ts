import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit/audit';
import { getRequestMeta } from '@/lib/security/request';
import { strict, zStr } from '@/lib/validation';
import { ensureTenant, getParams } from '@/lib/http/utils';

const Id = z.string().cuid();
const ClientUpdateSchema = strict({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional()
}).refine((d) => Object.keys(d).length > 0, { message: 'Empty payload' });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const tenantId = ensureTenant(req);
    const { id: rawId } = await getParams(ctx); const id = Id.parse(rawId);
    try {
        const before = await prisma.client.findUnique({ where: { id } });
        if (!before) return NextResponse.json({ code: 'not_found' }, { status: 404 });
        if (before.tenantId !== tenantId) return NextResponse.json({ code: 'forbidden' }, { status: 403 });
        const data = await ClientUpdateSchema.parseAsync(await req.json());
        const updated = await prisma.client.update({ where: { id }, data });
        const { requestId, ip } = getRequestMeta(req as any);
        await audit({ tenantId, userId: req.headers.get('x-user-id') || 'system', entity: 'client', entityId: id, op: 'UPDATE', before, after: updated, requestId, ip });
        return NextResponse.json({ ok: true, client: updated });
    } catch (err) {
        if (err instanceof ZodError) return NextResponse.json({ code: 'validation_error', errors: err.flatten() }, { status: 422 });
        return NextResponse.json({ code: 'internal_error' }, { status: 500 });
    }
}
