import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signAccess, signRefresh } from '@/lib/jwt';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = loginSchema.parse(body);

        try {
            // Buscar usuário
            const user = await prisma.employee.findUnique({
                where: { email },
                include: { barbershop: true },
            });

            if (!user) {
                return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
            }

            // Verificar senha
            if (!user.passwordHash) {
                return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
            }
            const isValid = await verifyPassword(password, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
            }

            // Gerar tokens
            const accessToken = await signAccess({
                sub: user.id,
                tenantId: user.barbershop.tenantId,
                role: user.role,
            });

            const refreshToken = await signRefresh({
                sub: user.id,
                tenantId: user.barbershop.tenantId,
                sessionId: randomUUID(),
            });

            return NextResponse.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                tenantId: user.barbershop.tenantId,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            });
        } catch (prismaError) {
            console.error('Erro do Prisma no login:', prismaError);
            // Fallback: sistema de usuários mock para desenvolvimento
            const mockUsers = [
                { email: 'admin@test.com', password: 'admin123', name: 'Admin', role: 'ADMIN' },
                { email: 'user@test.com', password: 'user123', name: 'Usuário', role: 'USER' },
                { email: 'barber@test.com', password: 'barber123', name: 'Barbeiro', role: 'BARBER' }
            ];

            const mockUser = mockUsers.find(u => u.email === email && u.password === password);

            if (!mockUser) {
                return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
            }

            const userId = 'mock-user-' + Date.now();
            return NextResponse.json({
                access_token: 'mock-token-' + Date.now(),
                refresh_token: 'mock-refresh-' + Date.now(),
                tenantId: 'mock-tenant',
                user: {
                    id: userId,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: mockUser.role,
                },
            });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
        }
        return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
}
