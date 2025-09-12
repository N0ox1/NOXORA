import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type AuditOp = 'CREATE' | 'UPDATE' | 'DELETE';

const secret = process.env.AUDIT_HMAC_SECRET || '';
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const hmac = (s: string) => secret ? crypto.createHmac('sha256', secret).update(s).digest('hex') : null;

export async function audit({
  tenantId,
  userId,
  entity,
  entityId,
  op,
  before,
  after,
  requestId,
  ip
}: {
  tenantId: string;
  userId: string;
  entity: string;
  entityId: string;
  op: AuditOp;
  before: any;
  after: any;
  requestId?: string | null;
  ip?: string | null;
}) {
  // Buscar último log para encadeamento
  const last = await prisma.auditLog.findFirst({
    where: { tenantId },
    orderBy: { ts: 'desc' },
    select: { hash: true }
  });
  const prev_hash = last?.hash ?? null;

  const payload = {
    tenantId,
    userId,
    entity,
    entityId,
    op,
    before,
    after,
    timestamp: new Date().toISOString(),
    prev_hash,
    requestId: requestId ?? null,
    ip: ip ?? null
  };

  const base = JSON.stringify(payload);
  const mac = hmac(base);
  const signature = mac ?? sha256(base);

  await prisma.auditLog.create({
    data: {
      tenantId: payload.tenantId,
      actorId: payload.userId,
      action: payload.op,
      entity: payload.entity,
      entityId: payload.entityId,
      ts: new Date(payload.timestamp),
      changes: { before: payload.before, after: payload.after },
      hash: signature,
      prevHash: payload.prev_hash,
      requestId: payload.requestId,
      ipAddress: payload.ip,
      severity: 'INFO',
      status: 'SUCCESS'
    }
  });
}
