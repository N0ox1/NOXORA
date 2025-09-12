import { NextRequest, NextResponse } from 'next/server';

export function ensureTenant(req: NextRequest) {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) throw NextResponse.json({ code: 'missing_tenant', message: 'x-tenant-id requerido' }, { status: 400 });
    return tenantId;
}

export async function getParams<T>(ctx: { params: Promise<T> }): Promise<T> {
    return await ctx.params;
}
