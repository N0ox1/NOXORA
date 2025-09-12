import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

function jsonError(code: string, message: string, status = 400, details?: unknown) {
    return NextResponse.json({ code, message, details }, { status });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { tenantId, barbershopId, employeeId, serviceId, startAt, clientId, client, notes } = body || {};
        if (!tenantId || !barbershopId || !employeeId || !serviceId || !startAt) {
            return jsonError('bad_request', 'tenantId, barbershopId, employeeId, serviceId e startAt são obrigatórios', 400);
        }
        const start = new Date(startAt);
        if (isNaN(start.getTime())) return jsonError('bad_request', 'startAt inválido', 400);

        const [shop, emp, svc] = await Promise.all([
            prisma.barbershop.findFirst({ where: { id: barbershopId, tenantId }, select: { id: true } }),
            prisma.employee.findFirst({ where: { id: employeeId, tenantId, barbershopId }, select: { id: true } }),
            prisma.service.findFirst({ where: { id: serviceId, tenantId, barbershopId }, select: { id: true, durationMin: true, priceCents: true } })
        ]);
        if (!shop) return jsonError('not_found', 'Barbearia não encontrada no tenant', 404);
        if (!emp) return jsonError('not_found', 'Funcionário não encontrado no tenant/barbearia', 404);
        if (!svc) return jsonError('not_found', 'Serviço não encontrado no tenant/barbearia', 404);

        const end = new Date(start.getTime() + (svc.durationMin ?? 30) * 60_000);

        const overlap = await prisma.appointment.findFirst({
            where: { tenantId, employeeId, status: { in: ['CONFIRMED', 'PENDING'] }, startAt: { lt: end }, endAt: { gt: start } },
            select: { id: true }
        });
        if (overlap) return jsonError('slot_unavailable', 'Horário indisponível', 409);

        let resolvedClientId = clientId ?? null;
        if (!resolvedClientId && (client?.email || client?.phone)) {
            const found = await prisma.client.findFirst({
                where: { tenantId, OR: [{ email: client.email ?? undefined }, { phone: client.phone ?? undefined }] },
                select: { id: true }
            });
            if (found) resolvedClientId = found.id;
            else {
                const created = await prisma.client.create({
                    data: { tenantId, name: client?.name ?? 'Cliente', email: client?.email ?? null, phone: client?.phone ?? '+5511999999999' }
                });
                resolvedClientId = created.id;
            }
        } else if (!resolvedClientId) {
            // cria cliente padrão se não fornecido (clientId é obrigatório no schema)
            const created = await prisma.client.create({
                data: { tenantId, name: 'Cliente Anônimo', email: null, phone: '+5511999999999' }
            });
            resolvedClientId = created.id;
        }

        const appt = await prisma.appointment.create({
            data: {
                tenantId, barbershopId, employeeId, serviceId,
                status: 'CONFIRMED',
                startAt: start, endAt: end,
                clientId: resolvedClientId,
                notes: notes ?? null
            },
            select: { id: true, startAt: true, endAt: true }
        });

        return NextResponse.json({ id: appt.id, startAt: appt.startAt, endAt: appt.endAt }, { status: 201 });
    } catch (e: unknown) {
        // Tratamento de erros conhecidos lançados pelo próprio handler
        const k = e as { code?: string; message?: string; meta?: unknown };
        if (k?.code) {
            if (k.code === 'no_tenant') return jsonError('no_tenant', k.message ?? 'Tenant inválido', 400);
            if (k.code === 'no_employee') return jsonError('no_employee', k.message ?? 'Profissional inválido', 400);
            if (k.code === 'invalid_input') return jsonError('invalid_input', k.message ?? 'Entrada inválida', 422);
            if (k.code === 'overlap') return jsonError('overlap', k.message ?? 'Conflito de horário', 409);
        }

        // Prisma errors (ex.: P2002 unique constraint)
        if (e && typeof e === 'object' && 'code' in (e as object)) {
            const pe = e as Prisma.PrismaClientKnownRequestError;
            if (pe.code === 'P2002') {
                return jsonError('conflict', 'Conflito de agendamento', 409);
            }
        }

        return jsonError('internal_error', 'Erro interno', 500);
    }
}
