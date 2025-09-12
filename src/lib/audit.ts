export type AuditEntry = { ts: number; tenantId: string; actorId?: string; action: string; entity?: string; entityId?: string; diff?: any };
const g = globalThis as any;
if (!g.__NOX_AUDIT__) g.__NOX_AUDIT__ = [] as AuditEntry[];
const mem: AuditEntry[] = g.__NOX_AUDIT__;

export function audit(e: Omit<AuditEntry, 'ts'>) { mem.push({ ...e, ts: Date.now() }); }
export function listAudit(tenantId: string, limit = 100): AuditEntry[] { return mem.filter(x => x.tenantId === tenantId).slice(-limit).reverse(); }
export function clearAudit(tenantId?: string) { if (!tenantId) { mem.length = 0; return; } for (let i = mem.length - 1; i >= 0; i--) { if (mem[i].tenantId === tenantId) mem.splice(i, 1); } }
export class AuditService { static push(entry: Omit<AuditEntry, 'ts'>) { audit(entry); } static list(tenantId: string, limit = 100) { return listAudit(tenantId, limit); } static stats(tenantId: string) { const items = mem.filter(x => x.tenantId === tenantId); const byAction = items.reduce<Record<string, number>>((acc, it) => { acc[it.action] = (acc[it.action] || 0) + 1; return acc; }, {}); const lastTs = items.length ? Math.max(...items.map(i => i.ts)) : null; return { count: items.length, byAction, lastTs }; } }
