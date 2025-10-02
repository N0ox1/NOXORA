import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const selectTenantSchema = z.object({
    slug: z.string().optional(),
    tenantId: z.string().optional()
}).refine(data => data.slug || data.tenantId, {
    message: 'Slug ou tenantId é obrigatório'
});

export async function POST(req: NextRequest) {
    try {
        // Verificar gJwt no header Authorization
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { code: 'missing_token', message: 'Token de acesso não fornecido' },
                { status: 401 }
            );
        }

        const gJwt = authHeader.slice(7);
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json(
                { code: 'server_misconfig', message: 'JWT não configurado' },
                { status: 500 }
            );
        }

        // Verificar gJwt
        let gJwtPayload: any;
        try {
            gJwtPayload = jwt.verify(gJwt, jwtSecret);
        } catch {
            return NextResponse.json(
                { code: 'invalid_token', message: 'Token inválido' },
                { status: 401 }
            );
        }

        const customerId = gJwtPayload.sub;
        if (!customerId) {
            return NextResponse.json(
                { code: 'invalid_token', message: 'Token inválido' },
                { status: 401 }
            );
        }

        const body = await selectTenantSchema.parseAsync(await req.json());
        const { slug, tenantId } = body;

        let targetTenantId: string;

        if (slug) {
            // Resolver tenantId por slug
            const barbershop = await prisma.barbershop.findFirst({
                where: { slug },
                include: { tenant: true }
            });

            if (!barbershop) {
                return NextResponse.json(
                    { code: 'TENANT_NOT_FOUND', message: 'Barbearia não encontrada' },
                    { status: 404 }
                );
            }

            targetTenantId = barbershop.tenantId;
        } else {
            targetTenantId = tenantId!;
        }

        // Verificar se CustomerTenant existe
        let customerTenant = await prisma.customerTenant.findUnique({
            where: {
                customerId_tenantId: {
                    customerId,
                    tenantId: targetTenantId
                }
            },
            include: { tenant: true }
        });

        if (!customerTenant) {
            // Criar vínculo automaticamente se não existir
            const tenant = await prisma.tenant.findUnique({
                where: { id: targetTenantId }
            });

            if (!tenant) {
                return NextResponse.json(
                    { code: 'TENANT_NOT_FOUND', message: 'Tenant não encontrado' },
                    { status: 404 }
                );
            }

            customerTenant = await prisma.customerTenant.create({
                data: {
                    customerId,
                    tenantId: targetTenantId,
                    status: 'active',
                    roles: ['client']
                },
                include: { tenant: true }
            });
        }

        // Verificar se está banido
        if (customerTenant.status === 'banned') {
            return NextResponse.json(
                { code: 'BANNED_IN_TENANT', message: 'Você está banido desta barbearia' },
                { status: 403 }
            );
        }

        // Buscar slug da barbearia
        const barbershop = await prisma.barbershop.findFirst({
            where: { tenantId: targetTenantId }
        });

        if (!barbershop) {
            return NextResponse.json(
                { code: 'TENANT_NOT_FOUND', message: 'Barbearia não encontrada' },
                { status: 404 }
            );
        }

        // Gerar novo tJwt
        const tJwt = jwt.sign(
            {
                sub: customerId,
                selectedTenantId: targetTenantId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
            },
            jwtSecret
        );

        const response = NextResponse.json({
            tJwt,
            tJwtExp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
            tenant: {
                id: customerTenant.tenant.id,
                slug: barbershop.slug,
                name: customerTenant.tenant.name
            }
        });

        // Atualizar cookie tJwt
        response.cookies.set('tJwt', tJwt, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 24 * 60 * 60 // 24 horas
        });

        return response;

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    code: 'VALIDATION_ERROR',
                    message: 'Dados inválidos',
                    errors: error.errors
                },
                { status: 422 }
            );
        }

        console.error('Erro ao selecionar tenant:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}


