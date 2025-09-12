import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rlConsume } from '@/lib/rateLimitPublic'
import { clientIp, requireTenantSimple } from '@/lib/tenant'



const ok = (data: any, init: ResponseInit = {}) => NextResponse.json({ ok: true, data }, { status: 200, ...init })
const fail = (status: number, message: any) => NextResponse.json({ ok: false, error: message }, { status })

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const ip = clientIp(req)
    const tenantId = requireTenantSimple(req)
    const rl = rlConsume(ip, tenantId)
    if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': Math.ceil(rl.resetIn / 1000).toString() } })
    const { slug } = await ctx.params

    const shop = await prisma.barbershop.findFirst({
      where: { tenantId, slug: slug },
      select: { id: true, name: true, slug: true, isActive: true }
    })
    if (!shop) return fail(404, 'not_found')

    const [services, employees] = await Promise.all([
      prisma.service.findMany({
        where: { tenantId, barbershopId: shop.id, isActive: true },
        select: { id: true, name: true, durationMin: true, priceCents: true }
      }),
      prisma.employee.findMany({
        where: { tenantId, barbershopId: shop.id, active: true },
        select: { id: true, name: true, role: true }
      })
    ])

    return ok({ barbershop: shop, services, employees })
  } catch (err: any) {
    const status = typeof err?.status === 'number' ? err.status : 500
    return fail(status, err?.message ?? 'internal_error')
  }
}
