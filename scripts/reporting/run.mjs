import testAppointmentsDaily from './test-appointments-daily.mjs';
import testCancellationsDaily from './test-cancellations-daily.mjs';
import testOccupancyEmployee from './test-occupancy-employee.mjs';
import testSummary from './test-summary.mjs';
import testRefresh from './test-refresh.mjs';

(async () => {
    try {
        console.log('🚀 Running Reporting tests...\n');

        const tests = [
            { name: 'Appointments Daily', fn: testAppointmentsDaily },
            { name: 'Cancellations Daily', fn: testCancellationsDaily },
            { name: 'Occupancy Employee', fn: testOccupancyEmployee },
            { name: 'Summary', fn: testSummary },
            { name: 'Refresh', fn: testRefresh }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 Testing ${test.name}...`);
                const result = await test.fn();
                console.log(`✅ ${result}\n`);
            } catch (error) {
                console.error(`❌ ${test.name} failed:`, error.message);
                process.exit(1);
            }
        }

        console.log('🎯 All Reporting tests passed!');
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    }
})();


