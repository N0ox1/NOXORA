export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validateHeaders } from '@/lib/validation/middleware';
import { prisma } from '@/lib/prisma';

export const { GET } = api({
    GET: async (req: NextRequest) => {
        try {
            // Validate headers
            const headerError = validateHeaders(req);
            if (headerError) return headerError;

            const tenantId = req.headers.get('x-tenant-id');
            if (!tenantId) {
                return NextResponse.json({ code: 'unauthorized', message: 'Tenant ID obrigatório' }, { status: 401 });
            }

            // Parse query parameters
            const url = new URL(req.url);
            const start = url.searchParams.get('start');
            const end = url.searchParams.get('end');
            const employeeId = url.searchParams.get('employeeId');
            const serviceId = url.searchParams.get('serviceId');

            // Build where clause
            const where: any = { tenantId };

            if (start && end) {
                where.startAt = {
                    gte: new Date(start),
                    lte: new Date(end)
                };
            }

            if (employeeId) {
                where.employeeId = employeeId;
            }

            if (serviceId) {
                where.serviceId = serviceId;
            }

            // Buscar agendamentos do banco
            const appointments = await prisma.appointment.findMany({
                where,
                include: {
                    client: { select: { name: true, phone: true } },
                    employee: { select: { name: true } },
                    service: { select: { name: true, durationMin: true } }
                },
                orderBy: { startAt: 'asc' }
            });

            return NextResponse.json({
                items: appointments,
                total: appointments.length,
                page: 1,
                limit: 20
            }, { status: 200 });

        } catch (err) {
            console.error('Erro ao listar agendamentos:', err);
            return NextResponse.json({
                code: 'internal_error',
                message: 'Erro ao listar agendamentos'
            }, { status: 500 });
        }
    }
});

