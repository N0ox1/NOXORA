import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createViews() {
    try {
        console.log('Creating reporting views...');

        // 1. Create employees_hours table
        console.log('1. Creating employees_hours table...');
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS employees_hours (
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_min INT NOT NULL DEFAULT 0,
        PRIMARY KEY (employee_id, weekday)
      )
    `;

        // 2. Create indexes
        console.log('2. Creating indexes...');
        await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_appt_tenant_day ON appointments("tenantId", date_trunc('day', "startAt"))
    `;

        await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_appt_emp_day ON appointments("tenantId", "employeeId", date_trunc('day', "startAt"))
    `;

        await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments("tenantId", status)
    `;

        // 3. Create v_reporting_appt_daily view
        console.log('3. Creating v_reporting_appt_daily view...');
        await prisma.$executeRaw`
      CREATE OR REPLACE VIEW v_reporting_appt_daily AS
      SELECT
        a."tenantId",
        (a."startAt" AT TIME ZONE 'UTC')::date AS day,
        COUNT(*)::int AS appts_total,
        COUNT(*) FILTER (WHERE a.status IN ('CONFIRMED','DONE'))::int AS appts_ativos,
        COUNT(*) FILTER (WHERE a.status = 'CANCELED')::int AS appts_cancelados
      FROM appointments a
      GROUP BY 1,2
    `;

        // 4. Create v_reporting_emp_booked_min view
        console.log('4. Creating v_reporting_emp_booked_min view...');
        await prisma.$executeRaw`
      CREATE OR REPLACE VIEW v_reporting_emp_booked_min AS
      SELECT
        a."tenantId",
        a."employeeId",
        (a."startAt" AT TIME ZONE 'UTC')::date AS day,
        SUM(COALESCE(s."durationMin", 0))::int AS booked_min
      FROM appointments a
      JOIN services s ON s.id = a."serviceId"
      WHERE a.status IN ('CONFIRMED','DONE')
      GROUP BY 1,2,3
    `;

        // 5. Create v_reporting_emp_capacity_min view
        console.log('5. Creating v_reporting_emp_capacity_min view...');
        await prisma.$executeRaw`
      CREATE OR REPLACE VIEW v_reporting_emp_capacity_min AS
      WITH cal AS (
        SELECT e."tenantId", e.id AS employee_id, gs::date AS day
        FROM employees e
        CROSS JOIN generate_series(current_date - interval '60 days', current_date + interval '60 days', interval '1 day') gs
      )
      SELECT
        c."tenantId",
        c.employee_id,
        c.day,
        COALESCE(
          (SELECT SUM( GREATEST(0, EXTRACT(epoch FROM (eh.end_time - eh.start_time)) / 60 - eh.break_min) )
           FROM employees_hours eh
           WHERE eh.employee_id = c.employee_id AND eh.weekday = EXTRACT(dow FROM c.day)::int
          )::int,
          480
        ) AS capacity_min
      FROM cal c
    `;

        // 6. Create materialized view
        console.log('6. Creating mv_reporting_emp_occupancy_daily materialized view...');
        await prisma.$executeRaw`
      DROP MATERIALIZED VIEW IF EXISTS mv_reporting_emp_occupancy_daily
    `;

        await prisma.$executeRaw`
      CREATE MATERIALIZED VIEW mv_reporting_emp_occupancy_daily AS
      SELECT
        b."tenantId",
        b."employeeId" as employee_id,
        b.day,
        b.booked_min,
        GREATEST(0, c.capacity_min)::int AS capacity_min,
        CASE WHEN c.capacity_min > 0 THEN ROUND(100.0 * b.booked_min / c.capacity_min, 1) ELSE 0 END AS occupancy_pct
      FROM v_reporting_emp_booked_min b
      JOIN v_reporting_emp_capacity_min c
        ON c."tenantId" = b."tenantId" AND c.employee_id = b."employeeId" AND c.day = b.day
    `;

        // 7. Create indexes on materialized view
        console.log('7. Creating indexes on materialized view...');
        await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_emp_occ ON mv_reporting_emp_occupancy_daily("tenantId", employee_id, day)
    `;

        console.log('✅ All reporting views created successfully!');

    } catch (error) {
        console.error('❌ Error creating views:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createViews();
