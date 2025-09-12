import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function ensureTenant() {
  const existing = await prisma.tenant.findFirst({ where: { domain: 't_dev' } });
  if (existing) return existing;
  // name é obrigatório no seu schema
  return prisma.tenant.create({ data: { name: 't_dev', domain: 't_dev', plan: 'STARTER', isActive: true } as any });
}

async function ensureBarbershop(tenantId: string) {
  // Usa combinação tenantId+slug; se não houver unique composto, cai no findFirst+create.
  try {
    return await prisma.barbershop.upsert({
      where: { tenantId_slug: { tenantId, slug: 'barber-labs-centro' } },
      update: {},
      create: { tenantId, name: 'Barber Labs Centro', slug: 'barber-labs-centro', email: 'contato@labs.dev', phone: '+55', isActive: true }
    });
  } catch {
    const existing = await prisma.barbershop.findFirst({ where: { tenantId, slug: 'barber-labs-centro' } });
    if (existing) return existing;
    return prisma.barbershop.create({ data: { tenantId, name: 'Barber Labs Centro', slug: 'barber-labs-centro', email: 'contato@labs.dev', phone: '+55', isActive: true } });
  }
}

async function ensureService(tenantId: string, barbershopId: string) {
  // Usa id fixo se seu modelo permitir setar id manualmente; caso não permita, cria sem id.
  try {
    return await prisma.service.upsert({
      where: { id: 'srv_1' },
      update: {},
      create: { id: 'srv_1', tenantId, barbershopId, name: 'Corte', durationMin: 30, priceCents: 4000, isActive: true }
    });
  } catch {
    const existing = await prisma.service.findFirst({ where: { tenantId, barbershopId, name: 'Corte' } });
    if (existing) return existing;
    return prisma.service.create({ data: { tenantId, barbershopId, name: 'Corte', durationMin: 30, priceCents: 4000, isActive: true } });
  }
}

async function main() {
  console.log('🌱 Iniciando seed mínimo para S6...');
  const tenant = await ensureTenant();
  const bs = await ensureBarbershop(tenant.id);
  const srv = await ensureService(tenant.id, bs.id);
  console.log(JSON.stringify({ TENANT_ID: tenant.id, TENANT_DOMAIN: tenant.domain, BARBERSHOP_ID: bs.id, SERVICE_ID: srv.id }));
}

main().then(()=>process.exit(0)).catch(e=>{ console.error('❌ Erro no seed:', e); process.exit(1); });
