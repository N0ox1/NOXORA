import prisma from '../src/lib/prisma.ts';

console.log('prisma:', typeof prisma);
console.log('prisma keys:', Object.keys(prisma));
console.log('prisma.employee:', typeof prisma?.employee);
console.log('prisma.tenant:', typeof prisma?.tenant);
console.log('prisma.barbershop:', typeof prisma?.barbershop);