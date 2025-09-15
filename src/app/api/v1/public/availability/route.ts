export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validateHeaders, validateQuery } from '@/lib/validation/middleware';
import { availabilityQuery } from '@/lib/validation/schemas';

export const { GET } = api({
    GET: async (req: NextRequest) => {
        // Validate headers
        const headerError = validateHeaders(req);
        if (headerError) return headerError;

        // Validate query params
        const queryResult = validateQuery(availabilityQuery)(req);
        if (queryResult instanceof NextResponse) return queryResult;

        // TODO: Implement actual availability check with Prisma
        // This is a placeholder response
        return NextResponse.json({
            date: queryResult.data.date,
            employeeId: queryResult.data.employeeId,
            serviceId: queryResult.data.serviceId,
            availableSlots: [
                { time: '09:00', available: true },
                { time: '10:00', available: true },
                { time: '11:00', available: false }
            ]
        }, { status: 200 });
    }
});