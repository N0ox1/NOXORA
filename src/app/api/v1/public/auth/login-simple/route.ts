import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 Testando login sem Prisma...');

        const body = await req.json();
        console.log('📝 Body recebido:', { tenantId: body.tenantId, login: body.login, password: '***' });

        // Simular resposta de sucesso para testar
        return NextResponse.json({
            ok: true,
            client: {
                id: 'test-client-id',
                name: 'Cliente Teste',
                email: body.login,
                phone: null
            }
        });

    } catch (error) {
        console.error('❌ Erro no endpoint:', error);
        return NextResponse.json(
            { ok: false, error: error.message },
            { status: 400 }
        );
    }
}


