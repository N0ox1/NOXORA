import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 Verificando estrutura da tabela clients...');

        // Import direto do Prisma para evitar problemas de cache
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Verificar se a tabela clients existe e sua estrutura
        const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY ordinal_position
    `;

        console.log('📝 Estrutura da tabela clients:', result);

        // Verificar se há clients na tabela
        const clients = await prisma.client.findMany({ take: 5 });
        console.log('📝 Clients encontrados:', clients.length);

        await prisma.$disconnect();

        return NextResponse.json({
            message: 'Estrutura da tabela clients',
            structure: result,
            clientsCount: clients.length,
            sampleClients: clients
        });

    } catch (error) {
        console.error('❌ Erro ao verificar tabela:', error);
        return NextResponse.json(
            {
                code: 'database_error',
                message: 'Erro ao verificar tabela',
                error: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}


