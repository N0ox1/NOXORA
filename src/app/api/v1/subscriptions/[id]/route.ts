import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para atualizar assinatura
const updateSubscriptionSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').optional(),
    description: z.string().optional(),
    priceCents: z.number().min(0, 'Preço deve ser positivo').optional(),
    durationDays: z.number().min(1, 'Duração deve ser pelo menos 1 dia').optional(),
    services: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

// GET - Obter assinatura específica
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { code: 'missing_tenant', message: 'X-Tenant-Id é obrigatório' },
                { status: 400 }
            );
        }

        const subscription = await prisma.subscription.findFirst({
            where: {
                id: params.id,
                tenantId
            },
            include: {
                clientSubscriptions: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                email: true,
                            }
                        }
                    }
                }
            }
        });

        if (!subscription) {
            return NextResponse.json(
                { code: 'not_found', message: 'Assinatura não encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(subscription);

    } catch (error) {
        console.error('Erro ao obter assinatura:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// PUT - Atualizar assinatura
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { code: 'missing_tenant', message: 'X-Tenant-Id é obrigatório' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const validatedData = updateSubscriptionSchema.parse(body);

        // Verificar se a assinatura existe e pertence ao tenant
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                id: params.id,
                tenantId
            }
        });

        if (!existingSubscription) {
            return NextResponse.json(
                { code: 'not_found', message: 'Assinatura não encontrada' },
                { status: 404 }
            );
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: params.id },
            data: {
                ...validatedData,
                updatedAt: new Date(),
            },
            include: {
                clientSubscriptions: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                email: true,
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(updatedSubscription);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: 'validation_error', message: 'Dados inválidos', errors: error.errors },
                { status: 400 }
            );
        }

        console.error('Erro ao atualizar assinatura:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Excluir assinatura
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { code: 'missing_tenant', message: 'X-Tenant-Id é obrigatório' },
                { status: 400 }
            );
        }

        // Verificar se a assinatura existe e pertence ao tenant
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                id: params.id,
                tenantId
            },
            include: {
                clientSubscriptions: true
            }
        });

        if (!existingSubscription) {
            return NextResponse.json(
                { code: 'not_found', message: 'Assinatura não encontrada' },
                { status: 404 }
            );
        }

        // Verificar se há clientes ativos com esta assinatura
        const activeSubscriptions = existingSubscription.clientSubscriptions.filter(
            sub => sub.status === 'ACTIVE'
        );

        if (activeSubscriptions.length > 0) {
            return NextResponse.json(
                {
                    code: 'has_active_subscriptions',
                    message: 'Não é possível excluir uma assinatura com clientes ativos',
                    activeCount: activeSubscriptions.length
                },
                { status: 400 }
            );
        }

        await prisma.subscription.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Assinatura excluída com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir assinatura:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
