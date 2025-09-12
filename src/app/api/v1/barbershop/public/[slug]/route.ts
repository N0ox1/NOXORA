export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

const MOCK = {
  tnt_1: {
    'barber-labs-centro': {
      tenant_id: 'tnt_1',
      slug: 'barber-labs-centro',
      name: 'Barber Labs Centro',
      services: [
        { id: 'srv_1', name: 'Corte Masculino', duration_min: 30, price_cents: 4500 },
        { id: 'srv_2', name: 'Barba Completa', duration_min: 25, price_cents: 3500 }
      ]
    }
  }
} as const;

export async function GET(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params; // Next 15: params é Promise
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return new Response(JSON.stringify({ error: 'TENANT_HEADER_REQUIRED' }), { status: 400, headers: { 'content-type': 'application/json' } });
  const shop = (MOCK as any)[tenantId]?.[slug];
  if (!shop) return new Response(JSON.stringify({ error: 'NOT_FOUND' }), { status: 404, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify(shop), { status: 200, headers: { 'content-type': 'application/json', 'x-cache-source': 'db' } });
}


