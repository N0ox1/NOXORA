import testTemplates from './test-templates.mjs';
import testIdempotency from './test-idempotency.mjs';
import testRetriesDLQ from './test-retries-dlq.mjs';

async function runAllTests() {
    console.log('🚀 Running Outbox tests...\n');

    try {
        await testTemplates();
        console.log('');

        await testIdempotency();
        console.log('');

        await testRetriesDLQ();
        console.log('');

        console.log('🎯 All Outbox tests passed!');

    } catch (error) {
        console.error('❌ Outbox tests failed:', error.message);
        process.exit(1);
    }
}

runAllTests();
