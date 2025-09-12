import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import withDb from '../../../lib/prisma'
import { prisma } from '../../../lib/prisma'

const requireTenant = (req: NextRequest): string => {
  const t = req.headers.get('x-tenant-id')?.trim()
  if (!t) throw Object.assign(new Error('Missing X-Tenant-Id'), { status: 400 })
  return t
}

const phoneRegex = /^\+?\d{10,15}$/

const ClientUpdateSchema = z
  .object({
    id: z.string().min(1, 'id requerido'),
    name: z.string().min(1, 'nome inválido').optional(),
    phone: z.string().regex(phoneRegex, 'phone inválido').optional(),
    email: z.string().email('email inválido').optional(),
    notes: z.string().max(2000).optional()
  })
  .refine((d) => !!(d.name ?? d.phone ?? d.email ?? d.notes), {
    message: 'Nada para atualizar',
    path: ['_']
  })

const ClientDeleteSchema = z.object({ id: z.string().min(1) })

const ClientCreateSchema = z.object({
  name: z.string().min(1, 'nome inválido'),
  phone: z.string().regex(/^\+?\d{10,15}$/, 'phone inválido'),
  email: z.string().email('email inválido').optional(),
  notes: z.string().max(2000).optional()
})

export async function POST(req: NextRequest) {
  try {
    const tenantId = requireTenant(req)
    const data = ClientCreateSchema.parse(await req.json())

    const created = await prisma.client.create({
      data: { tenantId, ...data },
      select: { id: true, name: true, phone: true, email: true, notes: true, createdAt: true }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : err?.name === 'ZodError' ? 422 : 500
    const message = err?.name === 'ZodError' ? (err.flatten?.() ?? err.message) : (err?.message ?? 'Internal error')
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tenantId = requireTenant(req)
    const body = await req.json()
    const { id, ...update } = ClientUpdateSchema.parse(body)

    const result = await prisma.client.update({
      where: { id, tenantId },
      data: update,
      select: { id: true, name: true, phone: true, email: true, notes: true, updatedAt: true }
    })

    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : err?.name === 'ZodError' ? 422 : 500
    const message = err?.name === 'ZodError' ? err.flatten?.() ?? err.message : err?.message ?? 'Internal error'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const tenantId = requireTenant(req)
    const body = await req.json().catch(() => ({}))
    const { id } = ClientDeleteSchema.parse(body)

    const deleted = await prisma.client.delete({
      where: { id, tenantId }
    })

    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : err?.name === 'ZodError' ? 422 : 500
    const message = err?.name === 'ZodError' ? err.flatten?.() ?? err.message : err?.message ?? 'Internal error'
    return NextResponse.json({ error: message }, { status })
  }
}
