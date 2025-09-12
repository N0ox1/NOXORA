import { NextRequest, NextResponse } from 'next/server';
import redis from './redis';
const getCached = async (k:string)=>redis.get(k);
const setCached = async (k:string,v:string)=>redis.set(k,v);

// Middleware para validação de tenant e rate limiting
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar se é uma requisição para a API
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Rate limiting global por IP
      const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
      const globalRateLimit = await checkGlobalRateLimit(clientIp);
      
      if (!globalRateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit excedido. Tente novamente em alguns minutos.' },
          { status: 429 }
        );
      }

      // Verificar header X-Tenant-Id obrigatório
      const tenantId = request.headers.get('X-Tenant-Id');
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Header X-Tenant-Id é obrigatório' },
          { status: 400 }
        );
      }

      // Rate limiting por tenant
      const tenantRateLimit = await checkTenantRateLimit(tenantId, clientIp);
      if (!tenantRateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit do tenant excedido. Tente novamente em alguns minutos.' },
          { status: 429 }
        );
      }

      // Adicionar headers de cache
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Tenant-Id', tenantId);
      response.headers.set('X-Request-Id', crypto.randomUUID());
      
      return response;
    }

    // Para páginas estáticas, apenas adicionar headers de cache
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    
    return response;
    
  } catch (error) {
    console.error('Erro no middleware:', error);
    return NextResponse.next();
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[MIDDLEWARE] ${request.method} ${request.nextUrl.pathname} - ${duration}ms`);
  }
}

// Rate limiting global por IP (600 requisições por minuto)
async function checkGlobalRateLimit(clientIp: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:global:${clientIp}`;
  const currentRaw = await getCached(key);
  const current = typeof currentRaw === 'number' ? currentRaw : parseInt(String(currentRaw||'0')) || 0;
  
  if (current >= 600) {
    return { allowed: false, remaining: 0 };
  }
  
      await setCached(key, String(current + 1));
      return { allowed: true, remaining: Math.max(0, 600 - (current + 1)) };
}

// Rate limiting por tenant (60 requisições por minuto por IP)
async function checkTenantRateLimit(tenantId: string, clientIp: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:tenant:${tenantId}:${clientIp}`;
  const currentRaw = await getCached(key);
  const current = typeof currentRaw === 'number' ? currentRaw : parseInt(String(currentRaw||'0')) || 0;
  
  if (current >= 60) {
    return { allowed: false, remaining: 0 };
  }
  
      await setCached(key, String(current + 1));
      return { allowed: true, remaining: Math.max(0, 60 - (current + 1)) };
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


