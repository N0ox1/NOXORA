import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para criar assinatura
const createSubscriptionSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    priceCents: z.number().min(0, 'Preço deve ser positivo'),
    durationDays: z.number().min(1, 'Duração deve ser pelo menos 1 dia'),
    services: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
});

// GET - Listar assinaturas
export async function GET(req: NextRequest) {
    try {
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { code: 'missing_tenant', message: 'X-Tenant-Id é obrigatório' },
                { status: 400 }
            );
        }

        const subscriptions = await prisma.subscription.findMany({
            where: { tenantId },
            include: {
                clientSubscriptions: {
                    select: {
                        id: true,
                        status: true,
                        startDate: true,
                        endDate: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(subscriptions);

    } catch (error) {
        console.error('Erro ao listar assinaturas:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Criar nova assinatura
export async function POST(req: NextRequest) {
    try {
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { code: 'missing_tenant', message: 'X-Tenant-Id é obrigatório' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const validatedData = createSubscriptionSchema.parse(body);

        // Buscar a barbearia do tenant
        const barbershop = await prisma.barbershop.findFirst({
            where: { tenantId }
        });

        if (!barbershop) {
            return NextResponse.json(
                { code: 'barbershop_not_found', message: 'Barbearia não encontrada' },
                { status: 404 }
            );
        }

        const subscription = await prisma.subscription.create({
            data: {
                tenantId,
                barbershopId: barbershop.id,
                name: validatedData.name,
                description: validatedData.description,
                priceCents: validatedData.priceCents,
                durationDays: validatedData.durationDays,
                services: validatedData.services || [],
                benefits: validatedData.benefits || [],
            },
            include: {
                clientSubscriptions: true
            }
        });

        return NextResponse.json(subscription, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: 'validation_error', message: 'Dados inválidos', errors: error.errors },
                { status: 400 }
            );
        }

        console.error('Erro ao criar assinatura:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
