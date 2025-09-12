import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(code: string, message: string, status = 400, details?: any) {
    return NextResponse.json({ code, message, details }, { status });
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return jsonError('unauthorized', 'X-Tenant-Id header required', 401);
        }

        if (!from || !to) {
            return jsonError('bad_request', 'from and to query parameters are required (YYYY-MM-DD format)', 400);
        }

        // Validar formato das datas
        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return jsonError('bad_request', 'Invalid date format. Use YYYY-MM-DD', 400);
        }

        if (fromDate > toDate) {
            return jsonError('bad_request', 'from date must be before to date', 400);
        }

        // Query para buscar dados de cancelamentos com taxa
        const result = await prisma.$queryRaw`
      SELECT 
        day,
        appts_cancelados,
        CASE 
          WHEN appts_total > 0 THEN ROUND(100.0 * appts_cancelados / appts_total, 2) 
          ELSE 0 
        END as cancel_rate_pct
      FROM v_reporting_appt_daily 
      WHERE "tenantId" = ${tenantId} 
        AND day BETWEEN ${from}::date AND ${to}::date
      ORDER BY day ASC
    ` as Array<{
            day: string;
            appts_cancelados: number;
            cancel_rate_pct: number;
        }>;

        return NextResponse.json(
            {
                items: result,
                from,
                to,
                total: result.length
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                    'X-Cache-Source': 'db'
                }
            }
        );

    } catch (err: any) {
        console.error('Reporting cancellations daily error:', err);
        return jsonError('internal_error', 'Failed to fetch daily cancellations data', 500);
    }
}
