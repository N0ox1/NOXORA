import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.employee.updateMany({
    where: { email: 'owner@noxora.dev' },
    data: { failedLoginAttempts: 0, lockedUntil: null }
  });
  console.log('Lockout reset done');
}

main().catch(console.error).finally(() => prisma.$disconnect());


