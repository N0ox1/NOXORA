import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestTenant() {
    try {
        console.log('🔧 Criando tenant de teste...');

        const tenant = await prisma.tenant.upsert({
            where: { id: 'test-tenant-audit' },
            update: { name: 'Test Tenant' },
            create: {
                id: 'test-tenant-audit',
                name: 'Test Tenant'
            }
        });

        console.log('✅ Tenant criado:', tenant);

    } catch (error) {
        console.error('❌ Erro ao criar tenant:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestTenant();
