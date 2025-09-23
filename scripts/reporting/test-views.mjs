import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testViews() {
    try {
        console.log('Testing if views exist...');

        // Test v_reporting_appt_daily
        const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM v_reporting_appt_daily LIMIT 1
    `;

        console.log('✅ v_reporting_appt_daily exists:', result);

        // Test mv_reporting_emp_occupancy_daily
        const result2 = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM mv_reporting_emp_occupancy_daily LIMIT 1
    `;

        console.log('✅ mv_reporting_emp_occupancy_daily exists:', result2);

    } catch (error) {
        console.error('❌ Error testing views:', error.message);

        if (error.message.includes('relation "v_reporting_appt_daily" does not exist')) {
            console.log('Views not created. Running SQL...');

            // Execute the SQL file
            const fs = await import('fs');
            const sql = fs.readFileSync('prisma/migrations/20250906_reporting_views.sql', 'utf8');

            await prisma.$executeRawUnsafe(sql);
            console.log('✅ Views created successfully');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testViews();















