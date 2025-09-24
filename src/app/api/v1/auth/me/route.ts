import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Tentar obter token do cookie primeiro, depois do header Authorization
        let token = request.cookies.get('auth-token')?.value;

        if (!token) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return NextResponse.json(
                { message: 'Token não encontrado' },
                { status: 401 }
            );
        }

        // Verificar e decodificar o token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json(
                { message: 'Erro de configuração do servidor' },
                { status: 500 }
            );
        }

        const decoded = jwt.verify(token, jwtSecret) as any;
        const userId = decoded?.sub || decoded?.userId || null;
        const email = decoded?.email || null;

        let user = null as any;
        if (userId) {
            user = await prisma.employee.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    tenantId: true,
                    barbershopId: true,
                    active: true,
                },
            });
        } else if (email) {
            user = await prisma.employee.findUnique({
                where: { email },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    tenantId: true,
                    barbershopId: true,
                    active: true,
                },
            });
        }

        if (!user || !user.active) {
            return NextResponse.json(
                { message: 'Usuário não encontrado ou inativo' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                barbershopId: user.barbershopId,
            },
        });

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return NextResponse.json(
            { message: 'Token inválido' },
            { status: 401 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
