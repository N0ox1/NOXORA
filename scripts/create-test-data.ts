import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findFirst({});
  if (!tenant) { throw new Error('Sem tenant. Rode seed:owner primeiro.'); }
  const barbershop = await prisma.barbershop.findFirst({ where: { tenantId: tenant.id } });
  if (!barbershop) { throw new Error('Sem barbershop. Rode seed:owner primeiro.'); }
  
  let svc = await prisma.service.findFirst({ where: { tenantId: tenant.id, name: 'Corte Masculino' } });
  if (!svc) {
    svc = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        barbershopId: barbershop.id,
        name: 'Corte Masculino',
        durationMin: 30,
        priceCents: 5000
      }
    });
  }
  console.log(JSON.stringify({ SERVICE_ID: svc.id }));
}
main().catch((e)=>{ console.error(e); process.exit(1); }).finally(async()=>{ await prisma.$disconnect(); });
