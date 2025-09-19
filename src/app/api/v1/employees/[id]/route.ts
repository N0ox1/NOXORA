import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { audit } from '@/lib/audit/audit';
import { getRequestMeta } from '@/lib/security/request';

const EmployeeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional()
}).refine((d) => Object.keys(d).length > 0, { message: 'Empty payload' });

const IdSchema = z.string().min(1);

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ code: 'missing_tenant', message: 'x-tenant-id requerido' }, { status: 400 });
  }

  // Next 15: params é Promise
  const { id: rawId } = await ctx.params;
  const id = IdSchema.parse(rawId);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: 'invalid_json', message: 'Body JSON inválido' }, { status: 400 });
  }

  try {
    const data = await EmployeeUpdateSchema.parseAsync(body);

    // 1) Verifica se o employee existe e pertence ao tenant
    const existing = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, tenantId: true, name: true, email: true, active: true }
    });

    if (!existing) {
      return NextResponse.json({ code: 'not_found', message: 'Employee não encontrado' }, { status: 404 });
    }

    if (existing.tenantId !== tenantId) {
      return NextResponse.json({ code: 'forbidden', message: 'Employee não pertence ao tenant' }, { status: 403 });
    }

    // 2) Atualiza o employee
    const updated = await prisma.employee.update({
      where: { id },
      data
    });

    // 3) Audit log com encadeamento
    const userId = req.headers.get('x-user-id') ?? 'system';
    const { requestId, ip } = getRequestMeta(req);
    await audit({
      tenantId,
      userId,
      entity: 'employee',
      entityId: id,
      op: 'UPDATE',
      before: existing,
      after: updated,
      requestId,
      ip
    });

    return NextResponse.json({ ok: true, employee: updated });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ code: 'validation_error', errors: err.flatten() }, { status: 422 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json({ code: 'not_found', message: 'Employee não encontrado' }, { status: 404 });
      }
      if (err.code === 'P2002') {
        return NextResponse.json({ code: 'conflict', message: 'Conflito de unicidade' }, { status: 409 });
      }
      if (err.code === 'P2003') {
        return NextResponse.json({ code: 'invalid_relation', message: 'Violação de integridade referencial' }, { status: 400 });
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('[employees.put] error:', err);
    }
    return NextResponse.json({ code: 'internal_error', message: 'Erro inesperado' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ code: 'missing_tenant', message: 'x-tenant-id requerido' }, { status: 400 });
  }

  // Next 15: params é Promise
  const { id: rawId } = await ctx.params;
  const id = IdSchema.parse(rawId);

  try {
    // 1) Verifica se o employee existe e pertence ao tenant
    const existing = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, tenantId: true, name: true, email: true, active: true }
    });

    if (!existing) {
      return NextResponse.json({ code: 'not_found', message: 'Employee não encontrado' }, { status: 404 });
    }

    if (existing.tenantId !== tenantId) {
      return NextResponse.json({ code: 'forbidden', message: 'Employee não pertence ao tenant' }, { status: 403 });
    }

    // 2) Deleta o employee
    await prisma.employee.delete({
      where: { id }
    });

    // 3) Audit log
    const userId = req.headers.get('x-user-id') ?? 'system';
    const { requestId, ip } = getRequestMeta(req);
    await audit({
      tenantId,
      userId,
      entity: 'employee',
      entityId: id,
      op: 'DELETE',
      before: existing,
      after: null,
      requestId,
      ip
    });

    return NextResponse.json({ ok: true, message: 'Funcionário excluído com sucesso' });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ code: 'validation_error', errors: err.flatten() }, { status: 422 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json({ code: 'not_found', message: 'Employee não encontrado' }, { status: 404 });
      }
      if (err.code === 'P2003') {
        return NextResponse.json({ code: 'invalid_relation', message: 'Não é possível excluir funcionário com agendamentos' }, { status: 400 });
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('[employees.delete] error:', err);
    }
    return NextResponse.json({ code: 'internal_error', message: 'Erro inesperado' }, { status: 500 });
  }
}