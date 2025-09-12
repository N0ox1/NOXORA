import { api } from '@/app/api/(helpers)/handler';
import { getPrismaClient, readWithRetry } from '@/lib/database/pool';
import { cacheService, CACHE_KEYS, createCachedResponse } from '@/lib/cache/redis';
import { spanAttr } from '@/lib/obs';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(code: string, message: string, status = 400, details?: any) {
    return new Response(JSON.stringify({ code, message, details }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export const GET = api(async (req) => {
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const tenantId = req.headers.get('x-tenant-id');

    // Adicionar atributos ao span
    spanAttr({
        route: '/reporting/appointments/daily',
        from,
        to,
        tenantId: tenantId || 'unknown'
    });

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

    // Tentar obter do cache primeiro
    const route = '/api/v1/reporting/appointments/daily';
    const params = { tenantId, from, to };

    log().debug({ route, params }, 'Checking cache');
    const cached = await cacheService.get(route, params);

    if (cached) {
        log().debug({ route, params }, 'Cache HIT');
        return createCachedResponse(cached, 'redis');
    }

    log().debug({ route, params }, 'Cache MISS - fetching from DB');

    // Buscar dados do banco com retry
    const prisma = getPrismaClient();
    const result = await readWithRetry(async () => {
        return prisma.$queryRaw`
      SELECT 
        day,
        appts_total,
        appts_ativos,
        appts_cancelados
      FROM v_reporting_appt_daily 
      WHERE "tenantId" = ${tenantId} 
        AND day BETWEEN ${from}::date AND ${to}::date
      ORDER BY day ASC
    ` as Array<{
            day: string;
            appts_total: number;
            appts_ativos: number;
            appts_cancelados: number;
        }>;
    }, 'reporting-appointments-daily');

    const response = {
        items: result,
        from,
        to,
        total: result.length
    };

    // Armazenar no cache
    await cacheService.set(route, response, params);
    log().debug({ route, params, itemCount: result.length }, 'Data stored in cache');

    return createCachedResponse(response, 'db');
});
