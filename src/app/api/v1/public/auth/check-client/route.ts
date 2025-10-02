import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Verificando cliente na tabela clients...');
    
    const { prisma } = await import('@/lib/prisma');
    
    // Buscar cliente na tabela clients
    const client = await prisma.client.findFirst({
      where: {
        email: 'viniciusxiste079@gmail.com'
      }
    });
    
    console.log('📝 Cliente encontrado:', client);
    
    return NextResponse.json({
      message: 'Cliente verificado',
      client: client ? {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        hasPasswordHash: !!client.passwordHash
      } : null
    });

  } catch (error) {
    console.error('❌ Erro ao verificar cliente:', error);
    return NextResponse.json(
      { 
        message: 'Erro ao verificar cliente', 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}


