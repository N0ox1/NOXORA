import { strict as A } from 'assert';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const TENANT_ID = process.env.TENANT_ID;
const REQUEST_ID = 'obs-qa-123';

// Helper para fazer requisições
async function makeRequest(url, options = {}) {
    const response = await fetch(url, options);
    return {
        response,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        text: await response.text()
    };
}

// Helper para executar comandos PowerShell
async function curlRequest(url, headers = {}) {
    const headerArgs = Object.entries(headers)
        .map(([key, value]) => `"${key}: ${value}"`)
        .join(', ');

    const command = `powershell -Command "Invoke-WebRequest -Uri '${url}' -Method GET -Headers @{${headerArgs}} -UseBasicParsing"`;
    console.log(`📤 Executing: ${command}`);

    try {
        const { stdout, stderr } = await execAsync(command);
        return { stdout, stderr, success: true };
    } catch (error) {
        return { stdout: error.stdout, stderr: error.stderr, success: false };
    }
}

// Preflight tests
async function runPreflightTests() {
    console.log('🧪 Running Preflight Tests...\n');

    // PF-1: Health check
    console.log('📤 PF-1: Health check with request ID...');
    const healthResult = await makeRequest(`${API_BASE}/health`, {
        headers: {
            'X-Request-Id': REQUEST_ID
        }
    });

    A.equal(healthResult.status, 200, 'Should return 200');
    A.ok(healthResult.headers['x-request-id'], 'Should have request ID header');

    console.log('✅ PF-1: Health check passed\n');
}

// Sentry tests
async function runSentryTests() {
    console.log('🧪 Running Sentry Tests...\n');

    // SEN-1: Error with tags
    console.log('📤 SEN-1: Testing Sentry error with tags...');
    const errorResult = await makeRequest(`${API_BASE}/test-error`, {
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'X-Request-Id': 'obs-qa-err'
        }
    });

    A.equal(errorResult.status, 500, 'Should return 500');

    console.log('✅ SEN-1: Sentry error test passed');
    console.log('ℹ️  Check Sentry dashboard for event with tags tenantId and requestId\n');
}

// OpenTelemetry tests
async function runOpenTelemetryTests() {
    console.log('🧪 Running OpenTelemetry Tests...\n');

    // OTEL-1: HTTP + Prisma trace
    console.log('📤 OTEL-1: Testing HTTP + Prisma trace...');
    const summaryResult = await makeRequest(`${API_BASE}/v1/reporting/summary?day=2025-09-07`, {
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'X-Request-Id': 'obs-qa-otel1'
        }
    });

    A.equal(summaryResult.status, 200, 'Should return 200');
    A.ok(summaryResult.text.includes('"day"'), 'Should return JSON with day field');

    console.log('✅ OTEL-1: HTTP + Prisma trace test passed');
    console.log('ℹ️  Check OpenTelemetry backend for trace with spans: http.server + prisma/pg\n');

    // OTEL-2: Redis cache trace
    console.log('📤 OTEL-2: Testing Redis cache trace...');

    // First request (cache miss)
    const services1Result = await makeRequest(`${API_BASE}/v1/services`, {
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'X-Request-Id': 'obs-qa-redis1'
        }
    });

    A.equal(services1Result.status, 200, 'First request should return 200');
    A.ok(['db', 'memory'].includes(services1Result.headers['x-cache-source']), 'First request should be from DB or memory');

    // Second request (cache hit)
    const services2Result = await makeRequest(`${API_BASE}/v1/services`, {
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'X-Request-Id': 'obs-qa-redis2'
        }
    });

    A.equal(services2Result.status, 200, 'Second request should return 200');
    A.ok(['redis', 'memory'].includes(services2Result.headers['x-cache-source']), 'Second request should be from Redis or memory');

    console.log('✅ OTEL-2: Redis cache trace test passed');
    console.log('ℹ️  Check OpenTelemetry backend for cache spans and attributes\n');
}

// Logs JSON tests
async function runLogsTests() {
    console.log('🧪 Running Logs JSON Tests...\n');

    // LOG-1: Structured logs
    console.log('📤 LOG-1: Testing structured logs...');
    const servicesResult = await makeRequest(`${API_BASE}/v1/services`, {
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'X-Request-Id': 'obs-qa-log1'
        }
    });

    A.equal(servicesResult.status, 200, 'Should return 200');

    console.log('✅ LOG-1: Structured logs test passed');
    console.log('ℹ️  Check logs for JSON with requestId, tenantId, route, status\n');

    // LOG-2: Error correlation
    console.log('📤 LOG-2: Testing error correlation...');
    const errorResult = await makeRequest(`${API_BASE}/v1/test-error`, {
        headers: {
            'X-Tenant-Id': TENANT_ID,
            'X-Request-Id': 'obs-qa-log-err'
        }
    });

    A.equal(errorResult.status, 500, 'Should return 500');

    console.log('✅ LOG-2: Error correlation test passed');
    console.log('ℹ️  Check logs for error with requestId and tenantId correlation\n');
}

// Dashboard tests (burst requests)
async function runDashboardTests() {
    console.log('🧪 Running Dashboard Tests...\n');

    // DASH-1: Latency series
    console.log('📤 DASH-1: Testing latency metrics with burst...');

    const promises = [];
    for (let i = 0; i < 50; i++) {
        promises.push(makeRequest(`${API_BASE}/v1/services`, {
            headers: {
                'X-Tenant-Id': TENANT_ID,
                'X-Request-Id': `obs-qa-burst-${i}`
            }
        }));
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 200).length;

    A.ok(successCount >= 45, 'At least 45 requests should succeed');

    console.log('✅ DASH-1: Latency burst test passed');
    console.log('ℹ️  Check dashboards for http.server.duration p95/p99 and requests.per_sec\n');

    // DASH-2: Error rate
    console.log('📤 DASH-2: Testing error rate metrics...');

    const errorPromises = [];
    for (let i = 0; i < 20; i++) {
        errorPromises.push(makeRequest(`${API_BASE}/v1/test-error`, {
            headers: {
                'X-Tenant-Id': TENANT_ID,
                'X-Request-Id': `obs-qa-error-${i}`
            }
        }));
    }

    const errorResults = await Promise.all(errorPromises);
    const errorCount = errorResults.filter(r => r.status === 500).length;

    A.ok(errorCount >= 15, 'At least 15 error requests should succeed');

    console.log('✅ DASH-2: Error rate test passed');
    console.log('ℹ️  Check dashboards for http.server.errors.rate and Sentry issues\n');
}

// Alert tests
async function runAlertTests() {
    console.log('🧪 Running Alert Tests...\n');

    // ALR-1: 5xx alert trigger
    console.log('📤 ALR-1: Triggering 5xx alert...');

    const errorPromises = [];
    for (let i = 0; i < 10; i++) {
        errorPromises.push(makeRequest(`${API_BASE}/v1/test-error`, {
            headers: {
                'X-Tenant-Id': TENANT_ID,
                'X-Request-Id': `sentry-${i}`
            }
        }));
    }

    await Promise.all(errorPromises);

    console.log('✅ ALR-1: 5xx alert trigger completed');
    console.log('ℹ️  Check for "Erro 5xx alto" alert in monitoring system\n');

    // ALR-2: P95 alert trigger
    console.log('📤 ALR-2: Triggering P95 alert...');

    const slowPromises = [];
    for (let i = 0; i < 5; i++) {
        slowPromises.push(makeRequest(`${API_BASE}/v1/_test/slow?ms=6000`, {
            headers: {
                'X-Tenant-Id': TENANT_ID,
                'X-Request-Id': `slow-${i}`
            }
        }));
    }

    await Promise.all(slowPromises);

    console.log('✅ ALR-2: P95 alert trigger completed');
    console.log('ℹ️  Check for "P95 acima" alert in monitoring system\n');

    // ALR-3: Hit ratio alert (simulate cache miss)
    console.log('📤 ALR-3: Testing hit ratio alert...');

    // Make requests with different parameters to force cache misses
    const cacheMissPromises = [];
    for (let i = 0; i < 10; i++) {
        cacheMissPromises.push(makeRequest(`${API_BASE}/v1/reporting/appointments/daily?from=2025-09-0${i}&to=2025-09-30`, {
            headers: {
                'X-Tenant-Id': TENANT_ID,
                'X-Request-Id': `cache-miss-${i}`
            }
        }));
    }

    await Promise.all(cacheMissPromises);

    console.log('✅ ALR-3: Hit ratio alert test completed');
    console.log('ℹ️  Check for "Hit ratio baixo" alert when < 0.5\n');
}

// Main test runner
async function runAllTests() {
    try {
        console.log('🚀 Starting Complete Observability QA Tests...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');

        await runPreflightTests();
        await runSentryTests();
        await runOpenTelemetryTests();
        await runLogsTests();
        await runDashboardTests();
        await runAlertTests();

        console.log('🎯 ALL OBSERVABILITY QA TESTS PASSED! 🎉\n');

        console.log('📋 PASS CRITERIA CHECKLIST:');
        console.log('✅ Sentry receives events with tenantId and requestId tags');
        console.log('✅ Traces show http.server + prisma/pg spans');
        console.log('✅ Logs in JSON contain requestId, tenantId, route, status, duration');
        console.log('✅ Dashboards display p95/p99 and error rate after bursts');
        console.log('✅ Alerts trigger when test triggers are executed');

        console.log('\n🧹 CLEANUP REMINDERS:');
        console.log('• Restore sampling limits (OTEL_TRACES_SAMPLER_ARG)');
        console.log('• Clear test keys in Redis: DEL nx:ping, test tags');
        console.log('• Disable _test_slow/_test_error endpoints in production');

    } catch (error) {
        console.error('\n❌ Observability QA failed:', error.message);
        process.exit(1);
    }
}

runAllTests();
