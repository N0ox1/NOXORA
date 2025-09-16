# Observability Setup Guide

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# OpenTelemetry Configuration
OTEL_SERVICE_NAME=noxora-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer your-token
OTEL_RESOURCE_ATTRIBUTES=service.version=0.1.0,deployment.environment=staging

# Optional OpenTelemetry Settings
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.2

# Logging Configuration
LOG_LEVEL=info
```

## Setup Steps

1. **Install Dependencies** (already done):
   ```bash
   npm install @sentry/nextjs @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/instrumentation-http @opentelemetry/instrumentation-undici @opentelemetry/instrumentation-pg @prisma/instrumentation pino uuid pino-pretty --legacy-peer-deps
   ```

2. **Configure Environment Variables**:
   - Copy the variables above to your `.env.local` file
   - Set up your Sentry project and get the DSN
   - Configure your OpenTelemetry collector endpoint

3. **Run the Application**:
   ```bash
   npm run dev
   ```

4. **Test Observability**:
   ```bash
   npm run test:observability
   ```

## Features Implemented

- ✅ **OpenTelemetry Tracing**: Automatic instrumentation for HTTP, Prisma, and Redis
- ✅ **Sentry Error Tracking**: Automatic error capture with tenant and request correlation
- ✅ **Structured Logging**: JSON logs with Pino and correlation IDs
- ✅ **Request Correlation**: Automatic request ID generation and propagation
- ✅ **Span Attributes**: Custom attributes for tenant ID, routes, and parameters

## Dashboards

The system generates metrics for the following dashboards:

1. **API — Latência e Erros**: `http.server.duration.p95`, `http.server.duration.p99`, `http.server.errors.rate`
2. **Cache**: `cache.hit_ratio`, `cache.latency_ms`, `keys.count`
3. **DB Pool**: `db.pool_in_use`, `db.pool_wait_count`, `db.statement_timeout.count`

## Alerts

Configure these alerts in your monitoring system:

- **Erro 5xx alto**: `rate(http.server.errors{status>=500}[5m]) > 0.01`
- **P95 acima**: `http.server.duration.p95 > 250`
- **Hit ratio baixo**: `cache.hit_ratio < 0.5`
- **Pool esperando**: `db.pool_wait_count > 0`




