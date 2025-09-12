import { NextRequest, NextResponse } from 'next/server';
import { verifyAccess } from '@/lib/jwt';

export type AuthCtx = { userId: string; tenantId: string; role: string };

export async function requireAuth(req: NextRequest): Promise<{ctx: AuthCtx; res?: NextResponse}> {
  const auth = req.headers.get('authorization') || '';
  const headerTenant = req.headers.get('x-tenant-id') || '';
  
  if (!auth.startsWith('Bearer ')) return { ctx: null as any, res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  if (!headerTenant) return { ctx: null as any, res: NextResponse.json({ error: 'tenant_header_required' }, { status: 400 }) };
  
  try {
    const claims = await verifyAccess(auth.slice(7));
    if (headerTenant !== claims.tenantId) return { ctx: null as any, res: NextResponse.json({ error: 'tenant_mismatch' }, { status: 400 }) };
    return { ctx: { userId: claims.sub as string, tenantId: claims.tenantId as string, role: String(claims.role) } };
  } catch {
    return { ctx: null as any, res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }
}


