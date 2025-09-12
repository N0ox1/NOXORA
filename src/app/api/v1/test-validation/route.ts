export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validate } from '@/lib/validate';
import { employeeUpdate } from '@/lib/validation/schemas';

export const POST = async (req: NextRequest) => {
    try {
        console.log('🧪 Testando validação...');

        // Teste direto da validação
        const data = await validate(req, employeeUpdate);
        console.log('✅ Validação bem-sucedida:', data);

        return NextResponse.json({
            success: true,
            data
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Erro na validação:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error
        }, { status: 500 });
    }
};
