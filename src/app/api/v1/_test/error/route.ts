export async function GET(req: Request) {
    const tenantId = req.headers.get('x-tenant-id') ?? 'unknown';
    const requestId = req.headers.get('x-request-id') ?? 'unknown';
    throw new Error(`Test error for observability validation - tenantId: ${tenantId}, requestId: ${requestId}`);
}