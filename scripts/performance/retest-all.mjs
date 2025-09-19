import { strict as A } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const TENANT_ID = process.env.TENANT_ID;

// Executar todos os retestes
async function runAllRetests() {
    try {
        console.log('🚀 Starting All Performance Retests...\n');

        A.ok(TENANT_ID, 'TENANT_ID env var required');

        // Q2: Cache Invalidation
        console.log('🧪 Running Q2: Cache Invalidation...');
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        try {
            const { stdout, stderr } = await execAsync('node scripts/performance/retest-q2-invalidation.mjs');
            console.log(stdout);
            if (stderr) console.error(stderr);
            console.log('✅ Q2: Cache Invalidation PASSED\n');
        } catch (error) {
            console.error('❌ Q2: Cache Invalidation FAILED:', error.message);
            throw error;
        }

        // Q3: Availability Cache
        console.log('🧪 Running Q3: Availability Cache...');
        try {
            const { stdout, stderr } = await execAsync('node scripts/performance/retest-q3-availability.mjs');
            console.log(stdout);
            if (stderr) console.error(stderr);
            console.log('✅ Q3: Availability Cache PASSED\n');
        } catch (error) {
            console.error('❌ Q3: Availability Cache FAILED:', error.message);
            throw error;
        }

        // Q5: Statement Timeout
        console.log('🧪 Running Q5: Statement Timeout...');
        try {
            const { stdout, stderr } = await execAsync('node scripts/performance/retest-q5-timeout.mjs');
            console.log(stdout);
            if (stderr) console.error(stderr);
            console.log('✅ Q5: Statement Timeout PASSED\n');
        } catch (error) {
            console.error('❌ Q5: Statement Timeout FAILED:', error.message);
            throw error;
        }

        // Pool Load Test
        console.log('🧪 Running Pool Load Test...');
        try {
            const { stdout, stderr } = await execAsync('node scripts/performance/retest-pool-load.mjs');
            console.log(stdout);
            if (stderr) console.error(stderr);
            console.log('✅ Pool Load Test PASSED\n');
        } catch (error) {
            console.error('❌ Pool Load Test FAILED:', error.message);
            throw error;
        }

        console.log('🎯 ALL PERFORMANCE RETESTS PASSED! 🎉');

    } catch (error) {
        console.error('\n❌ Some retests failed:', error.message);
        process.exit(1);
    }
}

runAllRetests();









