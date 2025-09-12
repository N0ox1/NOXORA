import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { code: 'missing_tenant', message: 'X-Tenant-Id required' },
                { status: 400 }
            );
        }

        // Buscar tenant e plano
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { plan: true }
        });

        if (!tenant) {
            return NextResponse.json(
                { code: 'tenant_not_found', message: 'Tenant not found' },
                { status: 404 }
            );
        }

        // Definir limites baseados no plano
        const limits = {
            STARTER: { employees: 3, appointmentsPerMonth: 500, notificationsPerMonth: 2000 },
            PRO: { employees: 15, appointmentsPerMonth: 5000, notificationsPerMonth: 20000 },
            SCALE: { employees: 999, appointmentsPerMonth: 99999, notificationsPerMonth: 999999 }
        };

        const planLimits = limits[tenant.plan] || limits.STARTER;

        // Contar uso atual (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [notificationsCount, appointmentsCount, employeesCount] = await Promise.all([
            prisma.outbox.count({
                where: {
                    tenantId,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            prisma.appointment.count({
                where: {
                    tenantId,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            prisma.employee.count({
                where: { tenantId }
            })
        ]);

        return NextResponse.json({
            plan: tenant.plan,
            limits: planLimits,
            usage: {
                employees: employeesCount,
                appointmentsPerMonth: appointmentsCount,
                notificationsPerMonth: notificationsCount
            },
            remaining: {
                employees: Math.max(0, planLimits.employees - employeesCount),
                appointmentsPerMonth: Math.max(0, planLimits.appointmentsPerMonth - appointmentsCount),
                notificationsPerMonth: Math.max(0, planLimits.notificationsPerMonth - notificationsCount)
            }
        });

    } catch (error) {
        console.error('Error fetching quota:', error);

        return NextResponse.json(
            {
                code: 'quota_error',
                message: 'Failed to fetch quota information',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}


