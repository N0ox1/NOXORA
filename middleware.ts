import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const enc = new TextEncoder();
const JWT_SECRET = enc.encode(process.env.JWT_SECRET || 'noxora-super-secret-jwt-key-2025-development-only-32-chars');

function buildCors() {
  const allow = (process.env.ALLOWED_ORIGINS || '*').trim() || '*';
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', allow);
  h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'content-type, authorization, x-tenant-id');
  h.set('Access-Control-Max-Age', '86400');
  h.set('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  return h;
}

function isPublic(pathname: string) {
  // tolera barra final e variações
  const p = pathname.replace(/\/$/, '');
  return p === '/api/v1/openapi.json' || p === '/api/health' || p === '/api/v1/health' || p === '/api/v1/auth/me';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Proteger páginas do admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Verificar se o token é válido
    try {
      const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'noxora-super-secret-jwt-key-2025-development-only-32-chars');
      const { payload } = await jwtVerify(token, jwtSecret);

      // Token válido, continuar
      return NextResponse.next();
    } catch {
      // Token inválido, redirecionar para login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // CORS preflight sempre permitido
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: buildCors() });
  }

  // BYPASS público antes de qualquer auth
  if (isPublic(pathname)) {
    const res = NextResponse.next();
    res.headers.set('X-MW-Bypass', 'public');
    buildCors().forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  // Auth obrigatória nas demais APIs: aceita Bearer OU cookie httpOnly 'auth-token'
  let token: string = '';
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
  if (!token) token = req.cookies.get('auth-token')?.value || '';
  if (!token) {
    const res = NextResponse.json({ error: 'missing_token' }, { status: 401 });
    buildCors().forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  let payload: any;
  try {
    ({ payload } = await jwtVerify(token, JWT_SECRET));
  } catch {
    const res = NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    buildCors().forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  const jwtTenant = String(payload?.tenantId || '');
  if (!jwtTenant) {
    const res = NextResponse.json({ error: 'missing_tenant_in_jwt' }, { status: 401 });
    buildCors().forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  const headerTenant = req.headers.get('x-tenant-id');
  if (headerTenant && headerTenant !== jwtTenant) {
    const res = NextResponse.json({ error: 'tenant_mismatch' }, { status: 403 });
    buildCors().forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', jwtTenant);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  buildCors().forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: ['/api/:path*', '/dashboard/:path*'] };
