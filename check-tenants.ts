import { prisma } from './src/lib/prisma';

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', JSON.stringify(tenants, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
