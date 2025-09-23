import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para formatar horário HH:mm
const formatTime = (h: string | number, m: string | number): string => {
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
};

// Função para formatar string de horário
const formatTimeString = (timeString: string): string => {
    if (!timeString) {
        return timeString;
    }

    // Se tem ':', formatar normalmente
    if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        if (hours && minutes) {
            return formatTime(hours, minutes);
        }
    }

    // Se não tem ':', assumir que é só horas e adicionar ':00'
    if (timeString.length <= 2) {
        return formatTime(timeString, '0');
    }

    // Se tem 3 dígitos sem ':', assumir HMM e converter para 0H:MM
    if (timeString.length === 3 && !timeString.includes(':')) {
        const hours = timeString.slice(0, 1);
        const minutes = timeString.slice(1);
        return formatTime(hours, minutes);
    }

    // Se tem 4 dígitos sem ':', assumir HHMM e converter para HH:MM
    if (timeString.length === 4 && !timeString.includes(':')) {
        const hours = timeString.slice(0, 2);
        const minutes = timeString.slice(2);
        return formatTime(hours, minutes);
    }

    return timeString;
};


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
                instagram: true,
                whatsapp: true,
                logoUrl: true,
                bannerUrl: true,
                workingHours: true,
                isActive: true
            }
        });

        console.log('📋 Barbearia encontrada:', barbershop ? 'SIM' : 'NÃO');
        if (barbershop) {
            console.log('📊 Dados da barbearia:', {
                id: barbershop.id,
                name: barbershop.name,
                slug: barbershop.slug,
                logoUrl: barbershop.logoUrl,
                bannerUrl: barbershop.bannerUrl
            });

            console.log('🖼️ URLs de imagem do banco:', {
                logoUrl: barbershop.logoUrl,
                bannerUrl: barbershop.bannerUrl,
                logoUrlType: typeof barbershop.logoUrl,
                bannerUrlType: typeof barbershop.bannerUrl
            });
        }

        if (!barbershop) {
            return NextResponse.json({ code: 'not_found', message: 'Barbearia não encontrada' }, { status: 404 });
        }

        // Usar horários salvos ou padrão se não existir
        const defaultWorkingHours = {
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '19:00', closed: false },
            saturday: { open: '08:00', close: '17:00', closed: false },
            sunday: { open: '10:00', close: '16:00', closed: true }
        };

        // Formatar horários do banco
        const formattedWorkingHours = barbershop.workingHours ? Object.keys(barbershop.workingHours).reduce((acc, day) => {
            const dayData = barbershop.workingHours[day];
            return {
                ...acc,
                [day]: {
                    ...dayData,
                    open: formatTimeString(dayData.open),
                    close: formatTimeString(dayData.close)
                }
            };
        }, {}) : defaultWorkingHours;

        const barbershopWithMockFields = {
            ...barbershop,
            workingHours: formattedWorkingHours
        };

        console.log('📤 Resposta da API:', {
            logoUrl: barbershopWithMockFields.logoUrl,
            bannerUrl: barbershopWithMockFields.bannerUrl,
            logoUrlType: typeof barbershopWithMockFields.logoUrl,
            bannerUrlType: typeof barbershopWithMockFields.bannerUrl
        });
        console.log('⏰ Horários de funcionamento carregados:', barbershopWithMockFields.workingHours);

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
        console.log('🖼️ URLs de imagem recebidas:', {
            logoUrl: body.logoUrl,
            bannerUrl: body.bannerUrl
        });
        console.log('⏰ Horários de funcionamento recebidos:', body.workingHours);

        // Buscar a barbearia atual do tenant
        const currentBarbershop = await prisma.barbershop.findFirst({
            where: { tenantId }
        });

        if (!currentBarbershop) {
            return NextResponse.json({ code: 'not_found', message: 'Barbearia não encontrada' }, { status: 404 });
        }

        // Formatar horários antes de salvar
        const formattedWorkingHours = body.workingHours ? Object.keys(body.workingHours).reduce((acc, day) => {
            const dayData = body.workingHours[day];
            return {
                ...acc,
                [day]: {
                    ...dayData,
                    open: formatTimeString(dayData.open),
                    close: formatTimeString(dayData.close)
                }
            };
        }, {}) : body.workingHours;

        // Atualizar apenas os campos que existem no schema atual
        const updateData: any = {
            name: body.name,
            slug: body.slug,
            description: body.description,
            address: body.address,
            phone: body.phone,
            email: body.email,
            workingHours: formattedWorkingHours,
            updatedAt: new Date()
        };

        // Atualizar instagram somente se enviado
        if (typeof body.instagram === 'string') {
            updateData.instagram = body.instagram;
        }
        // Atualizar logo/banner somente se enviados
        if (typeof body.logoUrl === 'string') {
            updateData.logoUrl = body.logoUrl;
        }
        if (typeof body.bannerUrl === 'string') {
            updateData.bannerUrl = body.bannerUrl;
        }

        console.log('💾 Salvando no banco de dados:', updateData);
        console.log('⏰ Horários sendo salvos:', updateData.workingHours);

        const updatedBarbershop = await prisma.barbershop.update({
            where: { id: currentBarbershop.id },
            data: updateData
        });

        console.log('✅ Dados salvos no banco:', {
            id: updatedBarbershop.id,
            logoUrl: updatedBarbershop.logoUrl,
            bannerUrl: updatedBarbershop.bannerUrl
        });
        console.log('⏰ Horários salvos no banco:', updatedBarbershop.workingHours);

        console.log('✅ Configurações da barbearia atualizadas:', {
            id: updatedBarbershop.id,
            name: updatedBarbershop.name,
            slug: updatedBarbershop.slug
        });

        // Retornar com campos mock para compatibilidade
        const responseBarbershop = {
            ...updatedBarbershop,
            workingHours: updatedBarbershop.workingHours || {
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