import { NextResponse } from 'next/server';
import type { AuthCtx } from '@/lib/authz';

export type Role = 'OWNER' | 'MANAGER' | 'BARBER' | 'ASSISTANT';
export const ROLES: Role[] = ['OWNER','MANAGER','ASSISTANT','BARBER'];

export function ensureRole(ctx: AuthCtx, allowed: Role[]) {
  if (!allowed.includes(ctx.role as Role)) {
    return NextResponse.json({ error: 'forbidden_role', required: allowed, got: ctx.role }, { status: 403 });
  }
  return null;
}


