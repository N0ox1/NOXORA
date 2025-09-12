import { enforceLimits } from '@/lib/billing/mock';

export function ensureWithinLimits(tenantId: string, kind: 'shops'|'seats', counts: { shops?: number; seats?: number }) {
  const res = enforceLimits(tenantId, counts);
  if (!res.ok) {
    const msg = `LIMIT_EXCEEDED:${res.field}:allowed=${res.allowed}`;
    const err: any = new Error(msg);
    err.status = 409; err.code = 'LIMIT_EXCEEDED'; err.field = res.field; err.allowed = res.allowed;
    throw err;
  }
}
