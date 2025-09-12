import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash, createHmac } from 'crypto';

const HMAC_SECRET = process.env.AUDIT_HMAC_SECRET;
if (!HMAC_SECRET) {
    throw new Error('AUDIT_HMAC_SECRET environment variable is required');
}

export interface AuditContext {
    tenantId: string;
    actorId?: string;
    actorRole?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
}

export interface AuditData {
    action: string;
    entity: string;
    entityId: string;
    before?: any;
    after?: any;
}

// Get previous hash for tenant
async function getPrevHash(tenantId: string): Promise<string> {
    const lastAudit = await prisma.auditLog.findFirst({
        where: { tenantId },
        orderBy: [{ ts: 'desc' }, { id: 'desc' }],
        select: { hash: true }
    });

    return lastAudit?.hash || 'genesis';
}

// Calculate HMAC hash
function calculateHash(prevHash: string, payload: any): string {
    const data = [
        prevHash,
        payload.tenantId,
        payload.action,
        payload.entity,
        payload.entityId || '',
        payload.changes ? JSON.stringify(payload.changes, null, 2) : '',
        payload.metadata ? JSON.stringify(payload.metadata, null, 2) : ''
    ].join('|');

    return createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

// Create audit log entry
export async function createAuditLog(
    context: AuditContext,
    data: AuditData
): Promise<void> {
    try {
        const prevHash = await getPrevHash(context.tenantId);

        const payload = {
            tenantId: context.tenantId,
            actorId: context.actorId,
            actorType: context.actorRole,
            action: data.action,
            entity: data.entity,
            entityId: data.entityId,
            changes: data.after,
            metadata: data.before,
            ipAddress: context.ip,
            userAgent: context.userAgent
        };

        const hash = calculateHash(prevHash, payload);

        await prisma.auditLog.create({
            data: {
                ...payload,
                prevHash,
                hash,
                hmac: createHmac('sha256', HMAC_SECRET).update(hash).digest('hex')
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit failure shouldn't break the main operation
    }
}

// Helper for common audit patterns
export class AuditLogger {
    constructor(private context: AuditContext) { }

    async logCreate(entity: string, entityId: string, data: any) {
        await createAuditLog(this.context, {
            action: 'create',
            entity,
            entityId,
            before: null,
            after: data
        });
    }

    async logUpdate(entity: string, entityId: string, before: any, after: any) {
        await createAuditLog(this.context, {
            action: 'update',
            entity,
            entityId,
            before,
            after
        });
    }

    async logDelete(entity: string, entityId: string, before: any) {
        await createAuditLog(this.context, {
            action: 'delete',
            entity,
            entityId,
            before,
            after: null
        });
    }
}

// Create audit logger from request
export function createAuditLogger(req: NextRequest): AuditLogger {
    const context = getAuditContext(req);
    return new AuditLogger(context);
}

// Get audit context from request
export function getAuditContext(req: NextRequest): AuditContext {
    const tenantId = req.headers.get('x-tenant-id') || 'unknown';
    const actorId = req.headers.get('x-actor-id') || undefined;
    const actorRole = req.headers.get('x-actor-role') || undefined;
    const requestId = req.headers.get('x-request-id') || undefined;
    const ip = req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    return {
        tenantId,
        actorId,
        actorRole,
        ip,
        userAgent,
        requestId
    };
}
