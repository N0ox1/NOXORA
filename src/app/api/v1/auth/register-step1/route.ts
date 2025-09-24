import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';

const RegisterStep1Schema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(1, 'Telefone é obrigatório'),
    businessName: z.string().min(1, 'Nome do negócio é obrigatório'),
    hasDiscountCoupon: z.boolean().optional(),
    couponCode: z.string().optional()
});

export async function POST(req: NextRequest) {
    try {
        console.log('🔍 POST /api/v1/auth/register-step1 - Iniciando...');

        // Parse e validação dos dados
        const data = await RegisterStep1Schema.parseAsync(await req.json());
        console.log('📋 Dados recebidos:', data);

        try {
            // Verificações de duplicação para evitar abusos
            console.log('🔍 Verificando duplicações...');
            const existingByEmail = await prisma.employee.findFirst({ where: { email: data.email } });
            if (existingByEmail) {
                return NextResponse.json(
                    { code: 'email_exists', message: 'Email já cadastrado' },
                    { status: 409 }
                );
            }

            const domain = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30) || 'tenant';

            // Criar tenant, barbershop e user owner mínimos
            const tenant = await prisma.tenant.create({ data: { name: data.businessName, domain, plan: 'STARTER', status: 'TRIALING' } as any });
            const barbershop = await prisma.barbershop.create({ data: { tenantId: tenant.id, name: data.businessName, slug: 'main', isActive: true } as any });
            const user = await prisma.employee.create({ data: { tenantId: tenant.id, barbershopId: barbershop.id, name: data.name, email: data.email, role: 'OWNER', active: true } as any });

            let couponMessage: string | undefined;
            if (data.hasDiscountCoupon && data.couponCode) {
                console.log('🎫 Cupom de desconto fornecido:', data.couponCode);
                couponMessage = `Cupom "${data.couponCode}" será processado na próxima etapa.`;
            }

            // Resposta de sucesso
            const payload = {
                ok: true,
                message: 'Primeira etapa do cadastro concluída com sucesso',
                data: {
                    userId: user.id,
                    tenantId: tenant.id,
                    barbershopId: barbershop.id,
                    businessName: data.businessName,
                    ownerName: data.name,
                    hasDiscountCoupon: data.hasDiscountCoupon,
                    couponCode: data.couponCode,
                    couponMessage,
                    nextStep: 'password'
                }
            };

            console.log('🎉 Cadastro etapa 1 concluído:', payload);
            const res = NextResponse.json(payload, { status: 201 });

            // Definir cookies httpOnly de contexto de registro (curta duração)
            const secure = process.env.NODE_ENV === 'production';
            res.cookies.set('reg_tenant_id', tenant.id, { httpOnly: true, secure, sameSite: 'lax', maxAge: 60 * 60, path: '/' });
            res.cookies.set('reg_barbershop_id', barbershop.id, { httpOnly: true, secure, sameSite: 'lax', maxAge: 60 * 60, path: '/' });
            res.cookies.set('reg_user_id', user.id, { httpOnly: true, secure, sameSite: 'lax', maxAge: 60 * 60, path: '/' });

            return res;

        } catch (prismaError) {
            console.error('❌ Erro do Prisma no registro:', prismaError);

            // Log detalhado do erro
            if (prismaError instanceof Error) {
                console.error('❌ Mensagem do erro:', prismaError.message);
                console.error('❌ Stack trace:', prismaError.stack);
            }

            return NextResponse.json(
                {
                    code: 'database_error',
                    message: 'Erro ao salvar no banco de dados',
                    details: process.env.NODE_ENV === 'development' ? prismaError : undefined
                },
                { status: 500 }
            );
        }

    } catch (err) {
        console.error('❌ Erro no registro:', err);

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
