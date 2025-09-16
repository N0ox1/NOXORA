import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

const RegisterSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(1, 'Telefone é obrigatório'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

export async function POST(req: NextRequest) {
    try {
        // Parse e validação dos dados
        const data = await RegisterSchema.parseAsync(await req.json());

        try {
            // Verificar se email já existe
            const existingUser = await prisma.employee.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                return NextResponse.json(
                    { code: 'conflict', message: 'Email já está em uso' },
                    { status: 409 }
                );
            }

            // Hash da senha
            const passwordHash = await hashPassword(data.password);

            // Buscar ou criar tenant padrão
            let defaultTenant = await prisma.tenant.findFirst({
                where: { name: 'Default Tenant' }
            });

            if (!defaultTenant) {
                defaultTenant = await prisma.tenant.create({
                    data: {
                        name: 'Default Tenant',
                        plan: 'STARTER',
                        status: 'ACTIVE',
                        isActive: true
                    }
                });
            }

            // Buscar ou criar barbershop padrão
            let defaultBarbershop = await prisma.barbershop.findFirst({
                where: {
                    tenantId: defaultTenant.id,
                    slug: 'default-barbershop'
                }
            });

            if (!defaultBarbershop) {
                defaultBarbershop = await prisma.barbershop.create({
                    data: {
                        tenantId: defaultTenant.id,
                        slug: 'default-barbershop',
                        name: 'Barbearia Padrão',
                        description: 'Barbearia padrão para novos usuários',
                        isActive: true
                    }
                });
            }

            // Criar usuário (Employee)
            const user = await prisma.employee.create({
                data: {
                    tenantId: defaultTenant.id,
                    barbershopId: defaultBarbershop.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    passwordHash,
                    role: 'BARBER',
                    active: true
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true
                }
            });

            console.log('✅ Usuário registrado com sucesso no banco:', {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            });

            return NextResponse.json({
                ok: true,
                message: 'Usuário criado com sucesso',
                user
            }, { status: 201 });

        } catch (prismaError) {
            console.error('Erro do Prisma no registro:', prismaError);
            return NextResponse.json(
                {
                    code: 'database_error',
                    message: 'Erro ao salvar no banco de dados'
                },
                { status: 500 }
            );
        }

    } catch (err) {
        console.error('Erro no registro:', err);

        if (err instanceof ZodError) {
            return NextResponse.json(
                {
                    code: 'validation_error',
                    message: 'Dados inválidos',
                    errors: err.flatten()
                },
                { status: 422 }
            );
        }

        return NextResponse.json(
            {
                code: 'internal_error',
                message: 'Erro interno do servidor'
            },
            { status: 500 }
        );
    }
}

