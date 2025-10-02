import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
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

        // Buscar todos os tenants vinculados ao customer
        const customerTenants = await prisma.customerTenant.findMany({
            where: { customerId },
            include: {
                tenant: true,
                // Incluir barbershop para obter o slug
                tenant: {
                    include: {
                        barbershops: {
                            select: {
                                slug: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const tenants = customerTenants.map(ct => {
            const barbershop = ct.tenant.barbershops[0]; // Assumindo que cada tenant tem pelo menos uma barbearia

            return {
                id: ct.tenant.id,
                slug: barbershop?.slug || 'unknown',
                name: ct.tenant.name,
                status: ct.status
            };
        });

        return NextResponse.json({ tenants });

    } catch (error) {
        console.error('Erro ao buscar tenants:', error);
        return NextResponse.json(
            { code: 'internal_error', message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}


