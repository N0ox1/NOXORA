import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0, // OTel cuida dos traces
    profilesSampleRate: 0,
    integrations(defaults) {
        // remove integrações de tracing que importam instrumentations de terceiros
        return defaults.filter((i: any) => !String(i?.name || '').toLowerCase().includes('tracing'));
    }
});