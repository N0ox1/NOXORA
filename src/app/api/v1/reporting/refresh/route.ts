import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(code: string, message: string, status = 400, details?: any) {
    return NextResponse.json({ code, message, details }, { status });
}

export async function POST(req: NextRequest) {
    try {
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return jsonError('unauthorized', 'X-Tenant-Id header required', 401);
        }

        // Refresh da materialized view
        await prisma.$executeRaw`
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reporting_emp_occupancy_daily
    `;

        return NextResponse.json(
            {
                success: true,
                message: 'Materialized view refreshed successfully',
                timestamp: new Date().toISOString()
            },
            {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            }
        );

    } catch (err: any) {
        console.error('Reporting refresh error:', err);
        return jsonError('internal_error', 'Failed to refresh materialized view', 500);
    }
}












