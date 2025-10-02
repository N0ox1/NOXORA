import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';

export const ctx = new AsyncLocalStorage<{
    tenantId?: string;
    requestId?: string;
    userId?: string;
}>();

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

export function withCtx<T>(
    value: { tenantId?: string; requestId?: string; userId?: string },
    fn: () => Promise<T>
) {
    return ctx.run(value, fn);
}

export function log() {
    const c = ctx.getStore() || {};
    return logger.child({
        tenantId: c.tenantId,
        requestId: c.requestId,
        userId: c.userId
    });
}





















