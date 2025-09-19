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

            // 1. Verificar se email já existe
            const existingUserByEmail = await prisma.employee.findUnique({
                where: { email: data.email }
            });

            if (existingUserByEmail) {
                console.log('❌ Email já cadastrado:', data.email);
                return NextResponse.json(
                    { code: 'email_exists', message: 'Este email já está cadastrado em nosso sistema' },
                    { status: 409 }
                );
            }

            // 2. Verificar se telefone já existe
            const existingUserByPhone = await prisma.employee.findFirst({
                where: { phone: data.phone }
            });

            if (existingUserByPhone) {
                console.log('❌ Telefone já cadastrado:', data.phone);
                console.log('❌ Usuário existente com este telefone:', existingUserByPhone);
                return NextResponse.json(
                    { code: 'phone_exists', message: 'Este telefone já está cadastrado em nosso sistema' },
                    { status: 409 }
                );
            }

            // 3. Nome completo não é verificado - pode haver múltiplas pessoas com o mesmo nome
            // 4. Nome do negócio não é verificado - pode haver múltiplas barbearias com o mesmo nome em locais diferentes

            console.log('✅ Todas as verificações passaram - dados únicos');

            // Criar tenant para o negócio
            const tenant = await prisma.tenant.create({
                data: {
                    name: data.businessName,
                    plan: 'STARTER',
                    status: 'ACTIVE',
                    isActive: true
                }
            });

            console.log('✅ Tenant criado:', tenant.id);

            // Criar barbearia para o tenant
            const barbershop = await prisma.barbershop.create({
                data: {
                    tenantId: tenant.id,
                    slug: data.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    name: data.businessName,
                    description: `Barbearia ${data.businessName}`,
                    email: data.email, // Email do proprietário como email da barbearia
                    phone: data.phone, // Telefone do proprietário como telefone da barbearia
                    isActive: true
                }
            });

            console.log('✅ Barbearia criada:', barbershop.id);

            // Criar usuário (Employee) sem senha por enquanto
            console.log('🔧 Criando usuário com dados:', {
                tenantId: tenant.id,
                barbershopId: barbershop.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: 'OWNER'
            });

            const user = await prisma.employee.create({
                data: {
                    tenantId: tenant.id,
                    barbershopId: barbershop.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    role: 'OWNER',
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

            console.log('✅ Funcionário criado:', user.id);

            // Processar cupom de desconto se fornecido
            let couponMessage = '';
            if (data.hasDiscountCoupon && data.couponCode) {
                // Aqui você pode implementar validação do cupom
                // Por enquanto, apenas logamos o cupom
                console.log('🎫 Cupom de desconto fornecido:', data.couponCode);
                couponMessage = `Cupom "${data.couponCode}" será processado na próxima etapa.`;
            }

            // Resposta de sucesso
            const response = {
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
                    nextStep: 'password' // Próxima etapa será definir senha
                }
            };

            console.log('🎉 Cadastro etapa 1 concluído:', response);
            return NextResponse.json(response, { status: 201 });

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
