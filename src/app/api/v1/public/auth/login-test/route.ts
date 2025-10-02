import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 Testando endpoint de login...');

        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        console.log('📝 Slug recebido:', slug);

        if (!slug) {
            return NextResponse.json(
                { code: 'TENANT_NOT_FOUND', message: 'Slug é obrigatório' },
                { status: 404 }
            );
        }

        const body = await req.json();
        console.log('📝 Body recebido:', { email: body.email, password: '***' });

        return NextResponse.json({
            message: 'Endpoint funcionando',
            slug,
            email: body.email
        });

    } catch (error) {
        console.error('❌ Erro no endpoint:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor', error: error.message },
            { status: 500 }
        );
    }
}


