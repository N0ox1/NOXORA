export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validateHeaders, validateQuery } from '@/lib/validation/middleware';
import { availabilityQuery } from '@/lib/validation/schemas';
import { availabilityService } from '@/lib/availability/optimized';

export const { GET } = api({
    GET: async (req: NextRequest) => {
        const headerError = validateHeaders(req);
        if (headerError) return headerError;

        const tenantId = req.headers.get('x-tenant-id');
        if (!tenantId) {
            return NextResponse.json({ code: 'missing_tenant', message: 'Tenant obrigatório' }, { status: 400 });
        }

        const queryResult = validateQuery(availabilityQuery)(req);
        if (queryResult instanceof NextResponse) return queryResult;

        const { date, barbershopId, employeeId, serviceId } = queryResult.data;

        try {
            const { data } = await availabilityService.getAvailability(
                tenantId,
                barbershopId,
                employeeId || '',
                date
            );

            const availableSlots = data.slots
                .filter(slot => slot.available)
                .map(slot => ({
                    time: new Date(slot.start).toISOString().slice(11, 16),
                    available: slot.available
                }));

            return NextResponse.json({
                date,
                employeeId,
                serviceId,
                availableSlots
            }, { status: 200 });
        } catch (error) {
            console.error('Erro ao calcular disponibilidade pública:', error);
            return NextResponse.json({ code: 'internal_error', message: 'Erro ao calcular disponibilidade' }, { status: 500 });
        }
    }
});