import { prisma } from '@/lib/prisma';

// Set tenant context for RLS policies
export async function setTenantContext(tenantId: string): Promise<void> {
    try {
        await prisma.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;
    } catch (error) {
        console.error('Failed to set tenant context:', error);
        throw new Error('Failed to set tenant context');
    }
}

// Clear tenant context
export async function clearTenantContext(): Promise<void> {
    try {
        await prisma.$executeRaw`RESET app.tenant_id`;
    } catch (error) {
        console.error('Failed to clear tenant context:', error);
    }
}

// Execute query with tenant context
export async function withTenantContext<T>(
    tenantId: string,
    operation: () => Promise<T>
): Promise<T> {
    await setTenantContext(tenantId);
    try {
        return await operation();
    } finally {
        await clearTenantContext();
    }
}














