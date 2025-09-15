import { prisma } from '../prisma';
// import { getTenantId, getActor, getIp, getUa } from './context';

// Calculate hash for audit chain
function calculateHash(prevHash: string, data: any): string {
    const secret = process.env.AUDIT_HMAC_SECRET || 'default-secret';
    const dataStr = JSON.stringify(data, Object.keys(data).sort());
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(dataStr).digest('hex');
}

// Get previous hash for tenant
async function getPrevHash(tenantId: string): Promise<string> {
    const lastAudit = await prisma.auditLog.findFirst({
        where: { tenantId: tenantId },
        orderBy: [{ ts: 'desc' }, { id: 'desc' }],
        select: { hash: true }
    });

    return lastAudit?.hash || 'genesis';
}

// Audit middleware for Prisma
export function createAuditMiddleware() {
    // Note: $use is deprecated in newer Prisma versions
    // This middleware should be implemented differently
    // For now, return the prisma client as-is
    return prisma as any;
}

// Helper function to create audit entries manually
export async function createAuditEntry(data: {
    tenantId: string;
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    changes?: any;
    metadata?: any;
}) {
    try {
        const prevHash = await getPrevHash(data.tenantId);
        const hash = calculateHash(prevHash, data);

        await prisma.auditLog.create({
            data: {
                ...data,
                prevHash,
                hash
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
}

// Legacy middleware implementation (commented out due to $use deprecation)
/*
export function createAuditMiddleware() {
    return prisma.$use(async (params: any, next: any) => {
        const mutations = ['create', 'update', 'upsert', 'delete', 'createMany', 'updateMany', 'deleteMany'];

        // Only audit mutations
        if (!params.model || !mutations.includes(params.action)) {
            return next(params);
        }

        // Get tenant context
        const tenantId = getTenantId();
        if (!tenantId) {
            return next(params);
        }

        // Get actor context
        const actor = getActor();
        if (!actor) {
            return next(params);
        }

        const model = params.model;
        let before: any = null;
        let after: any = null;

        // Get before state for updates/deletes
        if (['update', 'upsert', 'delete'].includes(params.action)) {
            try {
                const where = params.args.where;
                if (where) {
                    before = await (prisma as any)[model].findUnique({ where });
                }
            } catch (error) {
                console.warn('Failed to get before state:', error);
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

            const payload = {
                tenantId: tenantId,
                actorId: actor.id,
                actorType: actor.role,
                action: `${model}.${params.action}`,
                entity: model,
                entityId: after?.id || before?.id || '',
                changes: { before, after },
                ipAddress: getIp(),
                userAgent: getUa(),
                prevHash: prevHash
            };

            const hash = calculateHash(prevHash, payload);

            await prisma.auditLog.create({
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
*/