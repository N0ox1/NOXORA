import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface AuditPayload {
    tenant_id: string;
    actor_id?: string;
    actor_role?: string;
    action: string;
    entity: string;
    entity_id?: string;
    before: any;
    after: any;
    ip?: string;
    user_agent?: string;
    prev_hash: string;
    hash: string;
}

// Get current tenant from context (implement based on your auth system)
function getTenantId(): string {
    // This should be set by your auth middleware
    return process.env.DEFAULT_TENANT_ID || 'unknown';
}

// Get current actor from context (implement based on your auth system)
function getActor(): { id?: string; role?: string } {
    // This should be set by your auth middleware
    return { id: 'system', role: 'SYSTEM' };
}

// Get client IP from request context
function getIp(): string | undefined {
    // This should be set by your request middleware
    return process.env.CLIENT_IP || undefined;
}

// Get user agent from request context
function getUa(): string | undefined {
    // This should be set by your request middleware
    return process.env.USER_AGENT || undefined;
}

// Calculate HMAC hash
function calculateHash(prevHash: string, payload: Omit<AuditPayload, 'hash'>): string {
    const secret = process.env.AUDIT_HMAC_SECRET;
    if (!secret) {
        throw new Error('AUDIT_HMAC_SECRET environment variable is required');
    }

    const data = [
        prevHash,
        payload.tenant_id,
        payload.action,
        payload.entity,
        payload.entity_id || '',
        payload.before ? JSON.stringify(payload.before, null, 2) : '',
        payload.after ? JSON.stringify(payload.after, null, 2) : ''
    ].join('|');

    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Get previous hash for tenant
async function getPrevHash(tenantId: string): Promise<string> {
    const lastAudit = await prisma.audit_log.findFirst({
        where: { tenant_id: tenantId },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: { hash: true }
    });

    return lastAudit?.hash || 'genesis';
}

// Audit middleware for Prisma
export function createAuditMiddleware() {
    return prisma.$use(async (params, next) => {
        const mutations = ['create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany'];

        // Only audit mutations
        if (!params.model || !mutations.includes(params.action)) {
            return next(params);
        }

        const model = params.model;
        const tenantId = getTenantId();
        const actor = getActor();

        let before = null;
        let after = null;

        // Get before state for updates/deletes
        if (['update', 'upsert', 'delete'].includes(params.action) && params.args?.where?.id) {
            try {
                before = await (prisma as any)[model].findUnique({
                    where: { id: params.args.where.id }
                });
            } catch (error) {
                console.warn('Failed to get before state for audit:', error);
            }
        }

        // Execute the mutation
        const result = await next(params);

        // Get after state
        if (!['delete', 'deleteMany'].includes(params.action)) {
            after = result;
        }

        // Create audit entry
        try {
            const prevHash = await getPrevHash(tenantId);

            const payload: Omit<AuditPayload, 'hash'> = {
                tenant_id: tenantId,
                actor_id: actor.id,
                actor_role: actor.role,
                action: `${model}.${params.action}`,
                entity: model,
                entity_id: after?.id || before?.id || null,
                before,
                after,
                ip: getIp(),
                user_agent: getUa(),
                prev_hash: prevHash
            };

            const hash = calculateHash(prevHash, payload);

            await prisma.audit_log.create({
                data: {
                    ...payload,
                    hash
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't fail the mutation if audit fails
        }

        return result;
    });
}

// Initialize audit middleware
export const auditMiddleware = createAuditMiddleware();

