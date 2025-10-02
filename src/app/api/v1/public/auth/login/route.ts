import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória')
});

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json(
                { code: 'TENANT_NOT_FOUND', message: 'Slug é obrigatório' },
                { status: 404 }
            );
        }

        // Resolve tenantId por slug
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

        const body = await loginSchema.parseAsync(await req.json());
        const { email, password } = body;

        // Normalizar email
        const normalizedEmail = email.toLowerCase().trim();

        // Buscar Customer por email
        const customer = await prisma.customer.findUnique({
            where: { email: normalizedEmail }
        });

        if (!customer || !customer.passwordHash) {
            return NextResponse.json(
                { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
        if (!isValidPassword) {
            return NextResponse.json(
                { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        // Buscar ou criar CustomerTenant (vínculo com a barbearia)
        let customerTenant = await prisma.customerTenant.findUnique({
            where: {
                customerId_tenantId: {
                    customerId: customer.id,
                    tenantId: barbershop.tenantId
                }
            }
        });

        if (!customerTenant) {
            // Criar vínculo automaticamente (comportamento automático)
            customerTenant = await prisma.customerTenant.create({
                data: {
                    customerId: customer.id,
                    tenantId: barbershop.tenantId,
                    status: 'active',
                    roles: ['client']
                }
            });
        }

        // Buscar todos os tenants vinculados para o gJwt
        const allCustomerTenants = await prisma.customerTenant.findMany({
            where: { customerId: customer.id },
            include: { tenant: true }
        });

        const tenantIds = allCustomerTenants.map(ct => ct.tenantId);

        // Gerar tokens
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json(
                { code: 'server_misconfig', message: 'JWT não configurado' },
                { status: 500 }
            );
        }

        // gJwt (Global JWT) - identidade do cliente
        const gJwt = jwt.sign(
            {
                sub: customer.id,
                tenants: tenantIds,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 dias
            },
            jwtSecret
        );

        // tJwt (Tenant JWT) - contexto atual
        const tJwt = jwt.sign(
            {
                sub: customer.id,
                selectedTenantId: barbershop.tenantId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
            },
            jwtSecret
        );

        const response = NextResponse.json({
            customer: {
                id: customer.id,
                email: customer.email,
                name: customer.name,
                phone: customer.phone
            },
            tenant: {
                id: barbershop.tenant.id,
                slug: barbershop.slug,
                name: barbershop.tenant.name
            },
            tokens: {
                gJwt,
                gJwtExp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
                tJwt,
                tJwtExp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            }
        });

        // Definir cookies
        response.cookies.set('gJwt', gJwt, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 // 30 dias
        });

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

        console.error('Erro no login:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}