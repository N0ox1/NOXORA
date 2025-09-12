import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(){
  const tenant = await prisma.tenant.findFirst({ where: { domain: 't_dev' } });
  if (!tenant) throw new Error('tenant t_dev não existe');
  
  const bs = await prisma.barbershop.findFirst({ 
    where: { tenantId: tenant.id, slug: 'barber-labs-centro' } 
  });
  if (!bs) throw new Error('barbershop barber-labs-centro não existe');
  
  const exists = await prisma.employee.findFirst({ 
    where: { tenantId: tenant.id, barbershopId: bs.id, name: 'Diego' } 
  });
  
  if (exists) { 
    console.log(JSON.stringify({ EMPLOYEE_ID: exists.id })); 
    return; 
  }
  
  const emp = await prisma.employee.create({ 
    data: { 
      tenantId: tenant.id, 
      barbershopId: bs.id, 
      name: 'Diego', 
      role: 'BARBER', 
      active: true 
    } 
  });
  
  console.log(JSON.stringify({ EMPLOYEE_ID: emp.id }));
}

main().then(()=>process.exit(0)).catch(e=>{ console.error('❌', e); process.exit(1); });
