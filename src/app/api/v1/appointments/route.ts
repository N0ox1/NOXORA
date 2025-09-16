export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validate } from '@/lib/validate';
import { validateHeaders } from '@/lib/validation/middleware';
import { appointmentCreate } from '@/lib/validation/schemas';
import { prisma } from '@/lib/prisma';

export const { POST, GET } = api({
    POST: async (req: NextRequest) => {
        try {
            // Validate headers first
            const headerError = validateHeaders(req);
            if (headerError) return headerError;

            // Validate body
            const data = await validate(req, appointmentCreate);

            const tenantId = req.headers.get('x-tenant-id');
            if (!tenantId) {
                return NextResponse.json({ code: 'unauthorized', message: 'Tenant ID obrigatório' }, { status: 401 });
            }

            // Criar agendamento no banco
            const startAt = new Date(data.scheduledAt);
            const service = await prisma.service.findUnique({
                where: { id: data.serviceId },
                select: { durationMin: true }
            });

            const endAt = new Date(startAt.getTime() + (service?.durationMin || 30) * 60000);

            const appointment = await prisma.appointment.create({
                data: {
                    tenantId,
                    clientId: data.clientId,
                    employeeId: data.employeeId,
                    serviceId: data.serviceId,
                    barbershopId: data.barbershopId,
                    startAt,
                    endAt,
                    notes: data.notes || '',
                    status: 'PENDING'
                },
                include: {
                    clients: { select: { name: true, phone: true } },
                    employees: { select: { name: true } },
                    services: { select: { name: true, durationMin: true } }
                }
            });

            return NextResponse.json({
                id: appointment.id,
                clientId: appointment.clientId,
                employeeId: appointment.employeeId,
                serviceId: appointment.serviceId,
                barbershopId: appointment.barbershopId,
                startAt: appointment.startAt.toISOString(),
                endAt: appointment.endAt.toISOString(),
                notes: appointment.notes,
                status: appointment.status,
                client: appointment.clients,
                employee: appointment.employees,
                service: appointment.services,
                createdAt: appointment.createdAt.toISOString()
            }, { status: 201 });
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            return NextResponse.json({
                code: 'internal_error',
                message: 'Erro ao criar agendamento'
            }, { status: 500 });
        }
    },

    GET: async (req: NextRequest) => {
        try {
            // Validate headers
            const headerError = validateHeaders(req);
            if (headerError) return headerError;

            const tenantId = req.headers.get('x-tenant-id');
            if (!tenantId) {
                return NextResponse.json({ code: 'unauthorized', message: 'Tenant ID obrigatório' }, { status: 401 });
            }

            // Listar agendamentos do banco
            const appointments = await prisma.appointment.findMany({
                where: { tenantId },
                include: {
                    clients: { select: { name: true, phone: true } },
                    employees: { select: { name: true } },
                    services: { select: { name: true, durationMin: true } }
                },
                orderBy: { startAt: 'desc' }
            });

            return NextResponse.json({
                appointments,
                total: appointments.length,
                page: 1,
                limit: 20
            }, { status: 200 });
        } catch (error) {
            console.error('Erro ao listar agendamentos:', error);
            return NextResponse.json({
                code: 'internal_error',
                message: 'Erro ao listar agendamentos'
            }, { status: 500 });
        }
    }
});