export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validate } from '@/lib/validate';
import { validateHeaders } from '@/lib/validation/middleware';
import { appointmentCreate } from '@/lib/validation/schemas';

export const { POST, GET } = api({
    POST: async (req: NextRequest) => {
        // Validate headers first
        const headerError = validateHeaders(req);
        if (headerError) return headerError;

        // Validate body
        const data = await validate(req, appointmentCreate);

        // TODO: Implement actual appointment creation with Prisma
        // This is a placeholder response
        return NextResponse.json({
            id: data.barbershopId,
            clientId: data.clientId,
            employeeId: data.employeeId,
            serviceId: data.serviceId,
            barbershopId: data.barbershopId,
            scheduledAt: data.scheduledAt,
            notes: data.notes,
            createdAt: new Date().toISOString()
        }, { status: 201 });
    },

    GET: async (req: NextRequest) => {
        // Validate headers
        const headerError = validateHeaders(req);
        if (headerError) return headerError;

        // TODO: Implement actual appointment listing with Prisma
        // This is a placeholder response
        return NextResponse.json({
            appointments: [],
            total: 0,
            page: 1,
            limit: 20
        }, { status: 200 });
    }
});