import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const slug = 't_dev';
  let tenant = await prisma.tenant.findFirst({ where: { domain: slug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: 't_dev', domain: slug, plan: 'STARTER', status: 'ACTIVE' } });
  }

  let shop = await prisma.barbershop.findFirst({ where: { tenantId: tenant.id, slug: 'main' } });
  if (!shop) {
    shop = await prisma.barbershop.create({ data: { tenantId: tenant.id, slug: 'main', name: 'Main Shop' } });
  }

  const email = 'owner@noxora.dev';
  const passwordHash = await bcrypt.hash('owner123', 10);
  let emp = await prisma.employee.findFirst({ where: { tenantId: tenant.id, email } });
  if (!emp) {
    emp = await prisma.employee.create({ data: { tenantId: tenant.id, barbershopId: shop.id, name: 'Owner', role: 'OWNER', email, passwordHash, active: true } });
  } else if (!emp.passwordHash) {
    emp = await prisma.employee.update({ where: { id: emp.id }, data: { passwordHash, active: true } });
  }

  console.log(JSON.stringify({ TENANT_ID: tenant.id, EMPLOYEE_ID: emp.id, email }));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
