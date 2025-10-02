import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { promises as fs } from 'node:fs';

const prisma = new PrismaClient();

async function makeTenant(tag: 'A'|'B') {
  const tenant = await prisma.tenant.create({ data: { name: `Tenant ${tag}` } });
  const shop = await prisma.barbershop.create({ data: { tenantId: tenant.id, name: `Shop ${tag}`, slug: `shop-${tag}-${Date.now()}`, isActive: true } });
  const email = `seed.${tag}.${Date.now()}@noxora.dev`;
  const password = 'OwnerP@ssw0rd1!';
  const passwordHash = await bcrypt.hash(password, 10);
  const emp = await prisma.employee.create({ data: { tenantId: tenant.id, name: `Owner ${tag}`, email, passwordHash, role: 'OWNER', active: true, barbershopId: shop.id } });
  const svc = await prisma.service.create({ data: { tenantId: tenant.id, barbershopId: shop.id, name: `Corte ${tag}`, durationMin: 30, priceCents: 5000, isActive: true } });
  return { tenantId: tenant.id, email, password, serviceId: (svc as any).id };
}

(async () => {
  console.log('🌱 Prisma seed: 2 tenants');
  const A = await makeTenant('A');
  const B = await makeTenant('B');
  await fs.mkdir('.seeds', { recursive: true });
  await fs.writeFile('.seeds/tenants.json', JSON.stringify({ A, B }, null, 2));
  console.log('✅ Seed pronto -> .seeds/tenants.json');
  console.log({ A: { tenantId: A.tenantId, email: A.email, serviceId: A.serviceId }, B: { tenantId: B.tenantId, email: B.email, serviceId: B.serviceId } });
})().catch(async (e) => { console.error('❌ Seed falhou:', e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });























