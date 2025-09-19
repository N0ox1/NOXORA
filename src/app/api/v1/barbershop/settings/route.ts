import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        console.log('🔍 GET /api/v1/barbershop/settings - Iniciando...');

        const tenantId = req.headers.get('x-tenant-id');
        console.log('📋 Tenant ID:', tenantId);

        if (!tenantId) {
            return NextResponse.json({ code: 'bad_request', message: 'x-tenant-id é obrigatório' }, { status: 400 });
        }

        // Buscar a barbearia do tenant
        console.log('🔍 Buscando barbearia para tenant:', tenantId);
        const barbershop = await prisma.barbershop.findFirst({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                address: true,
                phone: true,
                email: true,
                isActive: true
            }
        });

        console.log('📋 Barbearia encontrada:', barbershop ? 'SIM' : 'NÃO');
        if (barbershop) {
            console.log('📊 Dados da barbearia:', {
                id: barbershop.id,
                name: barbershop.name,
                slug: barbershop.slug
            });
        }

        if (!barbershop) {
            return NextResponse.json({ code: 'not_found', message: 'Barbearia não encontrada' }, { status: 404 });
        }

        // Adicionar campos mock para compatibilidade
        const barbershopWithMockFields = {
            ...barbershop,
            instagram: '@barberlabs',
            whatsapp: '11999999999',
            logoUrl: '',
            bannerUrl: '',
            workingHours: {
                monday: { open: '09:00', close: '18:00', closed: false },
                tuesday: { open: '09:00', close: '18:00', closed: false },
                wednesday: { open: '09:00', close: '18:00', closed: false },
                thursday: { open: '09:00', close: '18:00', closed: false },
                friday: { open: '09:00', close: '19:00', closed: false },
                saturday: { open: '08:00', close: '17:00', closed: false },
                sunday: { open: '10:00', close: '16:00', closed: true }
            }
        };

        return NextResponse.json(barbershopWithMockFields, { status: 200 });
    } catch (error: any) {
        console.error('❌ Erro ao obter configurações da barbearia:', error);
        console.error('❌ Stack trace:', error.stack);
        return NextResponse.json({ code: 'internal_error', message: 'Erro ao obter configurações' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        console.log('🔍 PUT /api/v1/barbershop/settings - Iniciando...');

        const tenantId = req.headers.get('x-tenant-id');
        if (!tenantId) {
            return NextResponse.json({ code: 'bad_request', message: 'x-tenant-id é obrigatório' }, { status: 400 });
        }

        const body = await req.json();
        console.log('📋 Dados recebidos:', body);

        // Buscar a barbearia atual do tenant
        const currentBarbershop = await prisma.barbershop.findFirst({
            where: { tenantId }
        });

        if (!currentBarbershop) {
            return NextResponse.json({ code: 'not_found', message: 'Barbearia não encontrada' }, { status: 404 });
        }

        // Atualizar apenas os campos que existem no schema atual
        const updatedBarbershop = await prisma.barbershop.update({
            where: { id: currentBarbershop.id },
            data: {
                name: body.name,
                slug: body.slug,
                description: body.description,
                address: body.address,
                phone: body.phone,
                email: body.email,
                updatedAt: new Date()
            }
        });

        console.log('✅ Configurações da barbearia atualizadas:', {
            id: updatedBarbershop.id,
            name: updatedBarbershop.name,
            slug: updatedBarbershop.slug
        });

        // Retornar com campos mock para compatibilidade
        const responseBarbershop = {
            ...updatedBarbershop,
            instagram: body.instagram || '@barberlabs',
            whatsapp: body.whatsapp || '11999999999',
            logoUrl: body.logoUrl || '',
            bannerUrl: body.bannerUrl || '',
            workingHours: body.workingHours || {
                monday: { open: '09:00', close: '18:00', closed: false },
                tuesday: { open: '09:00', close: '18:00', closed: false },
                wednesday: { open: '09:00', close: '18:00', closed: false },
                thursday: { open: '09:00', close: '18:00', closed: false },
                friday: { open: '09:00', close: '19:00', closed: false },
                saturday: { open: '08:00', close: '17:00', closed: false },
                sunday: { open: '10:00', close: '16:00', closed: true }
            }
        };

        return NextResponse.json({
            ok: true,
            message: 'Configurações salvas com sucesso',
            barbershop: responseBarbershop
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Erro ao atualizar configurações da barbearia:', error);
        console.error('❌ Stack trace:', error.stack);
        return NextResponse.json({ code: 'internal_error', message: 'Erro ao salvar configurações' }, { status: 500 });
    }
}