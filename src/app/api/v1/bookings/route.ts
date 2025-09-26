import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit/audit';
import { getRequestMeta } from '@/lib/security/request';
import { strict, cuid, zISODate } from '@/lib/validation';
import { ensureTenant } from '@/lib/http/utils';
import { cacheInvalidation } from '@/lib/cache/invalidation';

const BookingCreateSchema = strict({
    clientId: cuid(),
    serviceId: cuid(),
    employeeId: cuid(),
    barbershopId: cuid(),
    startAt: zISODate(),
    endAt: zISODate(),
    notes: z.string().optional().transform((s) => s?.trim())
});

export async function POST(req: NextRequest) {
    try {
        const tenantId = ensureTenant(req);
        const data = await BookingCreateSchema.parseAsync(await req.json());
        const created = await prisma.appointment.create({ data: { tenantId, ...data } });

        // Invalidar cache de disponibilidade para o dia do agendamento
        const appointmentDate = new Date(data.startAt).toISOString().split('T')[0]; // YYYY-MM-DD
        await cacheInvalidation.invalidateByOperation('appointments', tenantId, {
            barbershopId: data.barbershopId,
            day: appointmentDate
        });

        const { requestId, ip } = getRequestMeta(req as any);
        await audit({ tenantId, userId: req.headers.get('x-user-id') || 'system', entity: 'booking', entityId: created.id, op: 'CREATE', before: null, after: created, requestId, ip });
        return NextResponse.json({ ok: true, booking: created }, { status: 201 });
    } catch (err) {
        if (err instanceof ZodError) return NextResponse.json({ code: 'validation_error', errors: err.flatten() }, { status: 422 });
        if (err instanceof NextResponse) return err;
        return NextResponse.json({ code: 'internal_error' }, { status: 500 });
    }
}
