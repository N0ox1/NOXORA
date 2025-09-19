import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = NextResponse.json(
            { message: 'Logout realizado com sucesso' },
            { status: 200 }
        );

        // Remover o cookie de autenticação
        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Expira imediatamente
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        return NextResponse.json(
            { message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
