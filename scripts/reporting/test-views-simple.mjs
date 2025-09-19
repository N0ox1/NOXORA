import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testViews() {
    try {
        console.log('Testing views...');

        // Test v_reporting_appt_daily
        const result = await prisma.$queryRaw`
      SELECT * FROM v_reporting_appt_daily LIMIT 5
    `;

        console.log('✅ v_reporting_appt_daily:', result);

        // Test mv_reporting_emp_occupancy_daily
        const result2 = await prisma.$queryRaw`
      SELECT * FROM mv_reporting_emp_occupancy_daily LIMIT 5
    `;

        console.log('✅ mv_reporting_emp_occupancy_daily:', result2);

    } catch (error) {
        console.error('❌ Error testing views:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testViews();











