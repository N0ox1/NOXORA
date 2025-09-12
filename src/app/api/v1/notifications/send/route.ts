import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationRequestSchema, NotificationHeadersSchema } from '@/lib/notifications/types';
import { isTemplateAllowed, getAllowedTemplates } from '@/lib/outbox/allowedTemplates';

export async function POST(req: NextRequest) {
    try {
        // Validar headers
        const headers = {
            'x-tenant-id': req.headers.get('x-tenant-id'),
            'idempotency-key': req.headers.get('idempotency-key')
        };

        const headerValidation = NotificationHeadersSchema.safeParse(headers);
        if (!headerValidation.success) {
            return NextResponse.json(
                {
                    code: 'invalid_headers',
                    message: 'Headers inválidos',
                    details: headerValidation.error.issues
                },
                { status: 400 }
            );
        }

        const { 'x-tenant-id': tenantId, 'idempotency-key': idempotencyKey } = headerValidation.data;

        // Validar body
        const body = await req.json().catch(() => ({}));
        const bodyValidation = NotificationRequestSchema.safeParse(body);

        if (!bodyValidation.success) {
            return NextResponse.json(
                {
                    code: 'invalid_body',
                    message: 'Body inválido',
                    details: bodyValidation.error.issues
                },
                { status: 422 }
            );
        }

        const { template, to, data, forceFail } = bodyValidation.data;

        // Validar template permitido
        if (!isTemplateAllowed(template)) {
            return NextResponse.json(
                {
                    code: 'invalid_template',
                    message: 'Template não permitido',
                    details: {
                        allowed: getAllowedTemplates(),
                        received: template
                    }
                },
                { status: 422 }
            );
        }

        const idem = idempotencyKey ?? `send:${crypto.randomUUID()}`;

        // Simular falha se forceFail for true ou email termina com @dlq.dev
        const shouldFail = forceFail || to.endsWith('@dlq.dev');

        const rec = await prisma.outbox.upsert({
            where: {
                tenantId_messageKey: { tenantId, messageKey: idem }
            },
            update: {},
            create: {
                tenantId,
                template,
                to,
                payload: data ?? {},
                messageKey: idem,
                status: shouldFail ? 'FAILED' : 'PENDING',
                attempts: 0,
                maxAttempts: 5
            }
        });

        // Se já existe, retornar deduplicado
        if (rec.updatedAt.getTime() !== rec.createdAt.getTime()) {
            return NextResponse.json(
                {
                    id: rec.id,
                    status: rec.status,
                    messageKey: rec.messageKey,
                    dedup: true
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                id: rec.id,
                status: rec.status,
                messageKey: rec.messageKey
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error creating outbox record:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
