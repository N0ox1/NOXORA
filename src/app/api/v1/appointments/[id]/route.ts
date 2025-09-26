export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validate } from '@/lib/validate';
import { validateHeaders, validateParams } from '@/lib/validation/middleware';
import { idParam, appointmentUpdate } from '@/lib/validation/schemas';
import { prisma } from '@/lib/prisma';
import { cacheInvalidation } from '@/lib/cache/invalidation';

export const { GET, PUT, DELETE } = api({
  GET: async (req: NextRequest, context?: { params: any }) => {
    const { params } = context || { params: {} };
    // Validate headers
    const headerError = validateHeaders(req);
    if (headerError) return headerError;

    // Validate params
    const paramResult = validateParams(idParam)(req, params);
    if (paramResult instanceof NextResponse) return paramResult;

    // TODO: Implement actual appointment retrieval with Prisma
    // This is a placeholder response
    return NextResponse.json({
      id: params.id,
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      serviceId: '123e4567-e89b-12d3-a456-426614174000',
      barbershopId: '123e4567-e89b-12d3-a456-426614174000',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 30 * 60000).toISOString(),
      notes: 'Appointment notes',
      createdAt: new Date().toISOString()
    }, { status: 200 });
  },

  PUT: async (req: NextRequest, context?: { params: any }) => {
    const { params } = context || { params: {} };
    // Validate headers
    const headerError = validateHeaders(req);
    if (headerError) return headerError;

    // Validate params
    const paramResult = validateParams(idParam)(req, params);
    if (paramResult instanceof NextResponse) return paramResult;

    // Validate body
    const data = await validate(req, appointmentUpdate);

    // TODO: Implement actual appointment update with Prisma
    // This is a placeholder response
    return NextResponse.json({
      id: params.id,
      ...data,
      updatedAt: new Date().toISOString()
    }, { status: 200 });
  },

  DELETE: async (req: NextRequest, context?: { params: any }) => {
    const { params } = context || { params: {} };
    try {
      console.log('🧪 DELETE - Params recebidos:', params);

      // Validate headers (sem Content-Type para DELETE)
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ code: 'unauthorized', message: 'Tenant ID obrigatório' }, { status: 401 });
      }

      // Validar ID diretamente (sem usar validateParams por enquanto)
      if (!params.id) {
        return NextResponse.json({ code: 'validation_error', message: 'ID é obrigatório' }, { status: 422 });
      }

      // Buscar o agendamento
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: params.id,
          tenantId
        }
      });

      if (!appointment) {
        return NextResponse.json({ code: 'not_found', message: 'Agendamento não encontrado' }, { status: 404 });
      }

      // Atualizar status para CANCELED
      const updatedAppointment = await prisma.appointment.update({
        where: { id: params.id },
        data: { status: 'CANCELED' },
        include: {
          clients: { select: { name: true, phone: true } },
          employees: { select: { name: true } },
          services: { select: { name: true, durationMin: true } }
        }
      });

      // Invalidar cache de disponibilidade para o dia do agendamento
      const appointmentDate = updatedAppointment.startAt.toISOString().split('T')[0]; // YYYY-MM-DD
      await cacheInvalidation.invalidateByOperation('appointments', tenantId, {
        barbershopId: updatedAppointment.barbershopId,
        day: appointmentDate
      });

      return NextResponse.json({
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        client: updatedAppointment.clients,
        employee: updatedAppointment.employees,
        service: updatedAppointment.services,
        startAt: updatedAppointment.startAt.toISOString(),
        endAt: updatedAppointment.endAt.toISOString(),
        notes: updatedAppointment.notes,
        updatedAt: updatedAppointment.updatedAt.toISOString()
      }, { status: 200 });

    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      return NextResponse.json({
        code: 'internal_error',
        message: 'Erro ao cancelar agendamento',
        details: error.message
      }, { status: 500 });
    }
  }
});