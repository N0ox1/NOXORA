import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Deve aceitar os termos'),
  metadata: z.object({
    source: z.string().optional()
  }).optional()
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

    const body = await registerSchema.parseAsync(await req.json());
    const { email, password, name, phone, acceptTerms } = body;

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Import dinâmico do Prisma
    const { prisma } = await import('@/lib/prisma');

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

    // Verificar se já existe Customer com este email
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { 
          code: 'EMAIL_IN_USE_LOGIN_REQUIRED', 
          message: 'Email já está em uso. Faça login para continuar.' 
        },
        { status: 409 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar Customer global
    const customer = await prisma.customer.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
        phone: phone?.trim() || null
      }
    });

    // Criar CustomerTenant (vínculo com a barbearia)
    const customerTenant = await prisma.customerTenant.create({
      data: {
        customerId: customer.id,
        tenantId: barbershop.tenantId,
        status: 'active',
        roles: ['client']
      }
    });

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
        tenants: [barbershop.tenantId],
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
        phone: customer.phone,
        createdAt: customer.createdAt
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
      },
      links: {
        next: `/b/${slug}`
      }
    }, { status: 201 });

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

    console.error('Erro no registro:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}