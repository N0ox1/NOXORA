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
        const employeeId = url.searchParams.get('employeeId');
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

        // Validar employeeId se fornecido
        if (employeeId) {
            const employee = await prisma.employee.findFirst({
                where: {
                    id: employeeId,
                    tenantId
                },
                select: { id: true }
            });

            if (!employee) {
                return jsonError('not_found', 'Employee not found in tenant', 404);
            }
        }

        // Query para buscar dados de ocupação
        const result = await prisma.$queryRaw`
      SELECT 
        employee_id as "employeeId",
        day,
        booked_min,
        capacity_min,
        occupancy_pct
      FROM mv_reporting_emp_occupancy_daily 
      WHERE "tenantId" = ${tenantId} 
        AND day BETWEEN ${from}::date AND ${to}::date
        AND (${employeeId || null}::text IS NULL OR employee_id = ${employeeId || null}::text)
      ORDER BY day ASC, employee_id
    ` as Array<{
            employeeId: string;
            day: string;
            booked_min: number;
            capacity_min: number;
            occupancy_pct: number;
        }>;

        return NextResponse.json(
            {
                items: result,
                from,
                to,
                employeeId: employeeId || null,
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
        console.error('Reporting occupancy employee error:', err);
        return jsonError('internal_error', 'Failed to fetch employee occupancy data', 500);
    }
}
