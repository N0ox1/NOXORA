export const runtime = 'nodejs';

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Funções de limpeza síncronas (não async)
const clean = (v: string) => v.replace(/\s+/g, ' ').trim();

// Schema de validação com transforms síncronos
const testSecuritySchema = z.object({
    name: z
        .string()
        .min(1, 'name_required')
        .max(100, 'name_too_long')
        .transform(clean)
        .refine(
            (val) => !/<script|javascript:|on\w+=/i.test(val),
            'unsafe_chars'
        )
        .refine(
            (val) => !/[\x00-\x1F\x7F]/.test(val),
            'control_chars'
        )
        .refine(
            (val) => !/[;'"]|--|\/\*|\*\/|union\s+select|or\s+\d=\d|drop\s+table/i.test(val),
            'unsafe_chars'
        )
        .refine(
            (val) => /^[\p{L}\p{M} .'-]{1,100}$/u.test(val),
            'unsafe_chars'
        ),
    role: z.enum(['BARBER', 'ADMIN', 'CUSTOMER'], {
        errorMap: () => ({ message: 'invalid_role' })
    }),
    barbershopId: z.string().uuid('Invalid uuid')
});

export const POST = async (req: NextRequest) => {
    try {
        // 1. Verificar Content-Type
        const contentType = req.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json(
                { code: 'unsupported_media_type' },
                { status: 415 }
            );
        }

        // 2. Verificar headers obrigatórios
        const tenantId = req.headers.get('x-tenant-id');
        if (!tenantId) {
            return NextResponse.json(
                { code: 'bad_request', msg: 'missing_tenant' },
                { status: 400 }
            );
        }

        // 3. Parse do JSON com tratamento de erro
        let body;
        try {
            body = await req.json();
        } catch (error) {
            return NextResponse.json(
                { code: 'bad_request', msg: 'invalid_json' },
                { status: 400 }
            );
        }

        // 4. Validação com Zod
        const validationResult = testSecuritySchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.flatten();
            return NextResponse.json(
                {
                    code: 'validation_error',
                    errors: {
                        fieldErrors: errors.fieldErrors,
                        formErrors: errors.formErrors
                    }
                },
                { status: 422 }
            );
        }

        // 5. Dados válidos - retornar sucesso
        const validData = validationResult.data;

        return NextResponse.json(
            {
                id: 'test-' + Date.now(),
                name: validData.name,
                role: validData.role,
                barbershopId: validData.barbershopId,
                createdAt: new Date().toISOString()
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error in test-security endpoint:', error);
        return NextResponse.json(
            { code: 'internal_error', msg: 'Unexpected error' },
            { status: 500 }
        );
    }
};