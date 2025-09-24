import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signAccess, signRefresh } from '@/lib/jwt';
import { getErrorMessage } from '@/lib/errors/error-messages';
import jwt from 'jsonwebtoken';

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
                return NextResponse.json({
                    error: 'user_not_found',
                    message: getErrorMessage('user_not_found')
                }, { status: 401 });
            }

            // Verificar senha
            if (!user.passwordHash) {
                return NextResponse.json({
                    error: 'invalid_password',
                    message: getErrorMessage('invalid_password')
                }, { status: 401 });
            }
            const isValid = await verifyPassword(password, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({
                    error: 'invalid_password',
                    message: getErrorMessage('invalid_password')
                }, { status: 401 });
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

            console.log('✅ Login realizado com sucesso:', {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            });

            const response = NextResponse.json({
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

            // Definir cookie auth-token (JWT de sessão ~12h)
            const jwtSecret = process.env.JWT_SECRET;
            if (jwtSecret) {
                const isSecure = request.headers.get('x-forwarded-proto') === 'https';
                const cookieToken = jwt.sign({
                    userId: user.id,
                    tenantId: user.barbershop.tenantId,
                    barbershopId: user.barbershop.id,
                    role: user.role,
                    email: user.email,
                }, jwtSecret, { expiresIn: '12h' });
                response.cookies.set('auth-token', cookieToken, {
                    httpOnly: true,
                    secure: isSecure,
                    sameSite: 'lax',
                    path: '/',
                });
            }

            return response;
        } catch (prismaError) {
            console.error('Erro do Prisma no login:', prismaError);
            return NextResponse.json({
                error: 'database_error',
                message: getErrorMessage('database_error')
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json({
            error: 'internal_error',
            message: getErrorMessage('internal_error')
        }, { status: 500 });
    }
}
