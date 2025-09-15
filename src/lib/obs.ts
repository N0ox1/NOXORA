// import adiado para evitar bundle pesado; ver tagError()
import { diag, trace } from '@opentelemetry/api';
import { log, ctx } from './log';

export function bindRequest(req: Request) {
    const tenantId = (req.headers.get('x-tenant-id') || undefined);
    const requestId = req.headers.get('x-request-id') || undefined;
    return { tenantId, requestId };
}

export async function tagError(e: any, meta: { tenantId?: string; requestId?: string }) {
    try {
        const Sentry = await import('@sentry/nextjs');
        if (Sentry && (Sentry as any).getCurrentHub && (Sentry as any).getCurrentHub()?.getClient()) {
            Sentry.withScope((scope: any) => {
                if (meta.tenantId) scope.setTag('tenantId', meta.tenantId);
                if (meta.requestId) scope.setTag('requestId', meta.requestId);
                scope.setContext('error', { message: String(e?.message || e) });
                Sentry.captureException(e);
            });
        }
    } catch { }
    log().error({ err: e, ...meta }, 'unhandled_error');
}

export function spanAttr(attrs: Record<string, any>) {
    const span = trace.getActiveSpan();
    if (span) {
        for (const [k, v] of Object.entries(attrs)) {
            span.setAttribute(`noxora.${k}`, v);
        }
    }
}

export function logRequest(req: Request, res: Response, duration: number) {
    const method = req.method;
    const url = new URL(req.url);
    const route = url.pathname;
    const status = res.status;
    const cacheSource = res.headers.get('x-cache-source') || 'unknown';

    log().info({
        method,
        route,
        status,
        duration_ms: duration,
        cache_source: cacheSource,
    }, 'request_completed');
}
