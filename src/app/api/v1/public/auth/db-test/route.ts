import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 Testando conexão com banco...');

        // Import direto do Prisma para evitar problemas de cache
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        console.log('📝 Prisma Client criado');

        // Testar conexão básica
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('📝 Query executada:', result);

        // Testar se a tabela customers existe
        const customers = await prisma.customer.findMany({ take: 1 });
        console.log('📝 Tabela customers acessada:', customers.length, 'registros');

        // Testar se a tabela barbershops existe
        const barbershops = await prisma.barbershop.findMany({
            where: { slug: 'cortta' },
            include: { tenant: true }
        });
        console.log('📝 Barbearia cortta encontrada:', barbershops.length > 0);

        await prisma.$disconnect();

        return NextResponse.json({
            message: 'Conexão com banco funcionando',
            test: result,
            customersCount: customers.length,
            barbershopFound: barbershops.length > 0,
            barbershop: barbershops[0] || null
        });

    } catch (error) {
        console.error('❌ Erro na conexão com banco:', error);
        return NextResponse.json(
            {
                code: 'database_error',
                message: 'Erro na conexão com banco',
                error: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}


