import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/lib/availability/optimized';
import { createCachedResponse } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(code: string, message: string, status = 400, details?: any) {
    return NextResponse.json({ code, message, details }, { status });
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const tenantId = url.searchParams.get('tenantId');
        const employeeId = url.searchParams.get('employeeId');
        const date = url.searchParams.get('date'); // YYYY-MM-DD
        const barbershopId = url.searchParams.get('barbershopId');

        if (!tenantId || !employeeId || !date) {
            return jsonError('bad_request', 'tenantId, employeeId e date são obrigatórios', 400);
        }

        if (!barbershopId) {
            return jsonError('bad_request', 'barbershopId é obrigatório', 400);
        }

        // Validar formato da data
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return jsonError('bad_request', 'Formato de data inválido. Use YYYY-MM-DD', 400);
        }

        // Obter disponibilidade com cache
        const { data: availability, source } = await availabilityService.getAvailability(
            tenantId,
            barbershopId,
            employeeId,
            date
        );

        // Retornar resposta com headers de cache
        return createCachedResponse(availability, source, 200);
    } catch (err: any) {
        console.error('Availability error:', err);
        return jsonError('internal_error', 'Failed to fetch availability', 500);
    }
}

