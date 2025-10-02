import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Verificando todos os clientes...');
    
    const { prisma } = await import('@/lib/prisma');
    
    // Buscar todos os clientes
    const clients = await prisma.client.findMany({
      take: 10
    });
    
    console.log('📝 Clientes encontrados:', clients.length);
    
    return NextResponse.json({
      message: 'Clientes verificados',
      count: clients.length,
      clients: clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        hasPasswordHash: !!c.passwordHash
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao verificar clientes:', error);
    return NextResponse.json(
      { 
        message: 'Erro ao verificar clientes', 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}


