import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit/audit';
import { getRequestMeta } from '@/lib/security/request';
import { strict, zStr } from '@/lib/validation';
import { ensureTenant, getParams } from '@/lib/http/utils';

const Id = z.string().cuid();
const ServiceUpdateSchema = strict({
  name: z.string().min(1).optional(),
  durationMin: z.number().int().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
}).refine((d) => Object.keys(d).length > 0, { message: 'Empty payload' });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tenantId = ensureTenant(req);
  const { id: rawId } = await getParams(ctx); const id = Id.parse(rawId);
  try {
    const before = await prisma.service.findUnique({ where: { id }, select: { id: true, tenantId: true } });
    if (!before) return NextResponse.json({ code: 'not_found' }, { status: 404 });
    if (before.tenantId !== tenantId) return NextResponse.json({ code: 'forbidden' }, { status: 403 });
    const data = await ServiceUpdateSchema.parseAsync(await req.json());
    const updated = await prisma.service.update({ where: { id }, data });
    const { requestId, ip } = getRequestMeta(req as any);
    await audit({ tenantId, userId: req.headers.get('x-user-id') || 'system', entity: 'service', entityId: id, op: 'UPDATE', before, after: updated, requestId, ip });
    return NextResponse.json({ ok: true, service: updated });
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ code: 'validation_error', errors: err.flatten() }, { status: 422 });
    return NextResponse.json({ code: 'internal_error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tenantId = ensureTenant(req);
  const { id: rawId } = await getParams(ctx); const id = Id.parse(rawId);
  const before = await prisma.service.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ code: 'not_found' }, { status: 404 });
  if (before.tenantId !== tenantId) return NextResponse.json({ code: 'forbidden' }, { status: 403 });
  await prisma.service.delete({ where: { id } });
  const { requestId, ip } = getRequestMeta(req as any);
  await audit({ tenantId, userId: req.headers.get('x-user-id') || 'system', entity: 'service', entityId: id, op: 'DELETE', before, after: null, requestId, ip });
  return NextResponse.json({ ok: true });
}