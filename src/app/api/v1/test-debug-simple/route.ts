export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validateParams } from '@/lib/validation/middleware';
import { idParam } from '@/lib/validation/schemas';

export const GET = async (req: NextRequest, { params }: { params: any }) => {
    try {
        console.log('🧪 Testando debug simples...');
        console.log('Params recebidos:', params);

        // Teste 1: validateParams
        console.log('1️⃣ Testando validateParams...');
        const paramResult = validateParams(idParam)(req, params);
        console.log('Param result:', paramResult);
        console.log('Is NextResponse?', paramResult instanceof NextResponse);
        console.log('Type:', typeof paramResult);

        if (paramResult instanceof NextResponse) {
            console.log('❌ Param error:', paramResult);
            return paramResult;
        }
        console.log('✅ Params OK');

        return NextResponse.json({
            success: true,
            params: paramResult.data
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Erro no debug:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error
        }, { status: 500 });
    }
};
