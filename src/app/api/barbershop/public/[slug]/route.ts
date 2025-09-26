export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextURL } from 'next/dist/server/web/next-url';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await context.params;
        const cleanSlug = (slug || '').toString().trim().replace(/^@/, '').toLowerCase();
        console.log('🔍 Buscando barbearia pública com slug:', slug, '→ normalizado:', cleanSlug);
        if (!cleanSlug) {
            console.log('❌ Slug inválido:', slug);
            return NextResponse.json({ code: 'bad_request', message: 'slug inválido' }, { status: 400 });
        }

        // Descobrir tenant por domínio/subdomínio se enviado, senão pegar por slug global
        // Nota: se houver multi-tenant por header, pegar depois. Por enquanto, slug único.
        const barbershop = await prisma.barbershop.findFirst({
            where: { slug: { equals: cleanSlug, mode: 'insensitive' } },
            select: {
                id: true,
                name: true,
                description: true,
                slug: true,
                tenantId: true,
                logoUrl: true,
                bannerUrl: true,
                services: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        durationMin: true,
                        priceCents: true,
                        isActive: true
                    }
                },
                employees: {
                    where: { active: true, role: 'BARBER' },
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        active: true
                    }
                }
            }
        });

        console.log('📋 Barbearia encontrada:', barbershop ? 'SIM' : 'NÃO');
        if (barbershop) {
            console.log('📊 Dados da barbearia:', {
                id: barbershop.id,
                name: barbershop.name,
                slug: barbershop.slug,
                tenantId: barbershop.tenantId,
                servicesCount: barbershop.services?.length || 0,
                employeesCount: barbershop.employees?.length || 0
            });
        }

        if (!barbershop) {
            console.log('❌ Barbearia não encontrada para slug:', slug);
            return NextResponse.json({ code: 'not_found', message: 'barbearia não encontrada' }, { status: 404 });
        }

        // Mapear para o formato esperado pela página pública
        const payload = {
            id: barbershop.id,
            name: barbershop.name,
            description: barbershop.description,
            slug: barbershop.slug,
            tenantId: barbershop.tenantId,
            logoUrl: barbershop.logoUrl ?? null,
            bannerUrl: barbershop.bannerUrl ?? null,
            services: (barbershop.services || []).map((s) => ({
                id: s.id,
                name: s.name,
                duration_min: s.durationMin,
                price_cents: s.priceCents,
                is_active: s.isActive
            })),
            employees: (barbershop.employees || []).map((e) => ({
                id: e.id,
                name: e.name,
                role: e.role,
                active: e.active
            }))
        };

        return NextResponse.json(payload, { status: 200 });
    } catch (error: any) {
        console.error('❌ Erro ao obter barbearia pública:', error);
        console.error('❌ Stack trace:', error.stack);
        return NextResponse.json({ code: 'internal_error', message: 'Erro ao obter barbearia' }, { status: 500 });
    }
}


