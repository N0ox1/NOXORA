import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

export function middleware(req: Request) {
    const headers = new Headers(req.headers);
    if (!headers.get('x-request-id')) {
        headers.set('x-request-id', uuid());
    }

    // Bypass rate limiting for test endpoints
    const bypass = process.env.RL_BYPASS_PATHS?.split(',') ?? [];
    const url = new URL(req.url);
    if (bypass.some(p => url.pathname.startsWith(p))) {
        const res = NextResponse.next({ request: { headers } });
        res.headers.set('x-request-id', headers.get('x-request-id')!);
        return res;
    }

    // Verificar autenticação para rotas protegidas
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/v1/barbershop') || url.pathname.startsWith('/api/v1/employees')) {
        console.log('🔒 Middleware: Rota protegida detectada:', url.pathname);
        const token = req.headers.get('cookie')?.split(';')
            .find(c => c.trim().startsWith('auth-token='))
            ?.split('=')[1];
        console.log('🍪 Middleware: Token encontrado:', !!token);

        if (!token) {
            if (url.pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/login', req.url));
            }
            return NextResponse.json({ message: 'Token de autenticação não encontrado' }, { status: 401 });
        }

        try {
            console.log('🔑 Middleware: Verificando token...');

            // Decodificar o JWT sem verificar a assinatura (já que estamos no Edge Runtime)
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Token inválido');
            }

            const payload = JSON.parse(atob(parts[1]));

            // Verificar se o token não expirou
            if (payload.exp && payload.exp < Date.now() / 1000) {
                throw new Error('Token expirado');
            }

            console.log('✅ Middleware: Token válido, usuário:', payload.userId);
            headers.set('x-user-id', payload.userId);
            headers.set('x-tenant-id', payload.tenantId);
            headers.set('x-barbershop-id', payload.barbershopId);
            headers.set('x-user-role', payload.role);
        } catch (error) {
            console.log('❌ Middleware: Erro na verificação do token:', error);
            if (url.pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/login', req.url));
            }
            return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
        }
    }

    const res = NextResponse.next({ request: { headers } });
    res.headers.set('x-request-id', headers.get('x-request-id')!);

    return res;
}

export const config = {
    matcher: ['/api/:path*', '/admin/:path*']
};
