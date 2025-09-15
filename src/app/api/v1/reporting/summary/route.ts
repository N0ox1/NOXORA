export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validateHeaders, validateQuery } from '@/lib/validation/middleware';
import { reportingQuery } from '@/lib/validation/schemas';

export const { GET } = api({
    GET: async (req: NextRequest): Promise<NextResponse> => {
        // Validate headers
        const headerError = validateHeaders(req);
        if (headerError) return headerError;

        // Validate query params
        const queryResult = validateQuery(reportingQuery)(req);
        if (queryResult instanceof NextResponse) return queryResult;

        // TODO: Implement actual reporting with Prisma
        // This is a placeholder response
        return NextResponse.json({
            summary: {
                totalAppointments: 0,
                totalRevenue: 0,
                totalEmployees: 0,
                totalServices: 0
            },
            period: {
                from: queryResult.data.from,
                to: queryResult.data.to,
                day: queryResult.data.day
            },
            pagination: {
                page: queryResult.data.page,
                limit: queryResult.data.limit
            }
        },
            { status: 200 }
        );
    }
});