import { api } from '@/app/api/(helpers)/handler';
import { spanAttr } from '@/lib/obs';
import { log } from '@/lib/log';

export const GET = api(async (req) => {
    const url = new URL(req.url);
    const ms = parseInt(url.searchParams.get('ms') || '6000');
    const tenantId = req.headers.get('x-tenant-id');
    const requestId = req.headers.get('x-request-id');

    // Adicionar atributos ao span
    spanAttr({
        route: '/api/v1/_test/slow',
        tenantId: tenantId || 'unknown',
        requestId: requestId || 'unknown',
        delay_ms: ms
    });

    log().warn({ tenantId, requestId, delay_ms: ms }, 'Slow request test started');

    // Simular operação lenta
    await new Promise(resolve => setTimeout(resolve, ms));

    // Retornar erro se muito lento (simular timeout)
    if (ms > 5000) {
        log().error({ tenantId, requestId, delay_ms: ms }, 'Request timeout simulated');
        return new Response(JSON.stringify({
            code: 'timeout',
            message: 'Request timeout',
            delay_ms: ms
        }), {
            status: 504,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        status: 'ok',
        delay_ms: ms,
        requestId
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
});

