import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const tenantId = req.headers.get('x-tenant-id');
    const requestId = req.headers.get('x-request-id');

    console.log('🧪 Test error endpoint called:', { tenantId, requestId });

    // Forçar erro para testar Sentry
    throw new Error(`Test error for observability validation - tenantId: ${tenantId}, requestId: ${requestId}`);
}









