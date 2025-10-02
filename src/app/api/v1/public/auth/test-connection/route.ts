import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Testando conexão básica...');
    
    const { prisma } = await import('@/lib/prisma');
    console.log('📝 Prisma importado');
    
    // Teste simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('📝 Query executada:', result);
    
    return NextResponse.json({
      message: 'Conexão funcionando',
      result
    });

  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return NextResponse.json(
      { 
        message: 'Erro na conexão', 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}


