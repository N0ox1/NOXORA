import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheInvalidation } from '@/lib/cache/invalidation';

function jsonError(code: string, message: string, status = 400, _details?: unknown) {
    return NextResponse.json({ code, message }, { status });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
    try {
        const { id } = ctx.params;
        const url = new URL(_req.url);
        const tenantId = url.searchParams.get('tenantId');

        if (!tenantId) {
            return jsonError('bad_request', 'tenantId é obrigatório', 400);
        }

        // busca o agendamento
        const appointment = await prisma.appointment.findFirst({
            where: { id, tenantId },
            select: { id: true, startAt: true, status: true, barbershopId: true }
        });

        if (!appointment) {
            return jsonError('not_found', 'Agendamento não encontrado', 404);
        }

        // verifica se pode cancelar (exemplo: não pode cancelar muito próximo do horário)
        const now = new Date();
        const timeDiff = appointment.startAt.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 2) { // menos de 2 horas
            return jsonError('unprocessable_entity', 'Cancelamento não permitido com menos de 2 horas de antecedência', 422);
        }

        // cancela o agendamento
        await prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELED' }
        });

        // Invalidar cache de disponibilidade para o dia do agendamento
        const appointmentDate = appointment.startAt.toISOString().split('T')[0]; // YYYY-MM-DD
        await cacheInvalidation.invalidateByOperation('appointments', tenantId, {
            barbershopId: appointment.barbershopId,
            day: appointmentDate
        });

        return NextResponse.json({ id, status: 'CANCELED' }, { status: 200 });
    } catch (err) {
        const k = (err as unknown) as { code?: string; meta?: unknown; message?: string };
        const devDetails = { code: k?.code, meta: k?.meta, message: k?.message };
        return jsonError('internal_error', 'Erro inesperado', 500, devDetails);
    }
}

export async function PATCH(_req: NextRequest, ctx: { params: { id: string } }) {
    try {
        const { id } = ctx.params;
        const body = await _req.json().catch(() => ({}));
        const { tenantId, startAt, endAt } = body || {};

        if (!tenantId || !startAt || !endAt) {
            return jsonError('bad_request', 'tenantId, startAt e endAt são obrigatórios', 400);
        }

        const start = new Date(startAt);
        const end = new Date(endAt);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return jsonError('bad_request', 'startAt e endAt inválidos', 400);
        }

        // busca o agendamento
        const appointment = await prisma.appointment.findFirst({
            where: { id, tenantId },
            select: { id: true, startAt: true, status: true, employeeId: true, barbershopId: true }
        });

        if (!appointment) {
            return jsonError('not_found', 'Agendamento não encontrado', 404);
        }

        // verifica se pode reagendar (exemplo: não pode reagendar muito próximo do horário)
        const now = new Date();
        const timeDiff = appointment.startAt.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 2) { // menos de 2 horas
            return jsonError('unprocessable_entity', 'Reagendamento não permitido com menos de 2 horas de antecedência', 422);
        }

        // verifica se o novo horário não conflita
        const overlap = await prisma.appointment.findFirst({
            where: {
                tenantId,
                employeeId: appointment.employeeId,
                status: { in: ['CONFIRMED', 'PENDING'] },
                startAt: { lt: end },
                endAt: { gt: start },
                id: { not: id }
            },
            select: { id: true }
        });

        if (overlap) {
            return jsonError('slot_unavailable', 'Novo horário indisponível', 409);
        }

        // atualiza o agendamento
        const updated = await prisma.appointment.update({
            where: { id },
            data: { startAt: start, endAt: end },
            select: { id: true, startAt: true, endAt: true }
        });

        // Invalidar cache de disponibilidade para ambos os dias (antigo e novo)
        const oldAppointmentDate = appointment.startAt.toISOString().split('T')[0]; // YYYY-MM-DD
        const newAppointmentDate = start.toISOString().split('T')[0]; // YYYY-MM-DD

        await Promise.all([
            cacheInvalidation.invalidateByOperation('appointments', tenantId, {
                barbershopId: appointment.barbershopId,
                day: oldAppointmentDate
            }),
            cacheInvalidation.invalidateByOperation('appointments', tenantId, {
                barbershopId: appointment.barbershopId,
                day: newAppointmentDate
            })
        ]);

        return NextResponse.json(updated, { status: 200 });
    } catch (err) {
        const k = (err as unknown) as { code?: string; meta?: unknown; message?: string };
        const devDetails = { code: k?.code, meta: k?.meta, message: k?.message };
        return jsonError('internal_error', 'Erro inesperado', 500, devDetails);
    }
}
