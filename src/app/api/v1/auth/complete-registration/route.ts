import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, password } = body;

        // Validações básicas
        if (!userId || !password) {
            return NextResponse.json(
                { message: 'Dados obrigatórios não fornecidos' },
                { status: 400 }
            );
        }

        // Validar formato do userId (CUID)
        const cuidRegex = /^c[a-z0-9]{24}$/i;
        if (!cuidRegex.test(userId)) {
            return NextResponse.json(
                { message: 'ID de usuário inválido' },
                { status: 400 }
            );
        }

        // Validar senha
        if (password.length < 8) {
            return NextResponse.json(
                { message: 'Senha deve ter pelo menos 8 caracteres' },
                { status: 400 }
            );
        }

        if (password.length > 128) {
            return NextResponse.json(
                { message: 'Senha muito longa' },
                { status: 400 }
            );
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 12);

        // Verificar se usuário existe antes de atualizar
        const existingUser = await prisma.employee.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, passwordHash: true }
        });

        if (!existingUser) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Verificar se usuário já tem senha definida
        if (existingUser.passwordHash) {
            return NextResponse.json(
                { message: 'Usuário já possui senha definida' },
                { status: 400 }
            );
        }

        // Atualizar o usuário
        const updatedUser = await prisma.employee.update({
            where: { id: userId },
            data: { passwordHash },
            include: {
                tenant: true,
                barbershop: true,
            },
        });

        // Validar JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return NextResponse.json(
                { message: 'Erro de configuração do servidor' },
                { status: 500 }
            );
        }

        // Gerar JWT token para autenticação automática
        const token = jwt.sign(
            {
                userId: updatedUser.id,
                tenantId: updatedUser.tenantId,
                barbershopId: updatedUser.barbershopId,
                role: updatedUser.role,
                email: updatedUser.email,
            },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // Criar resposta com token (sem expor dados sensíveis)
        const response = NextResponse.json(
            {
                message: 'Cadastro finalizado com sucesso',
                success: true
            },
            { status: 200 }
        );

        // Definir cookie HTTP-only para segurança
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 dias
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Erro ao completar cadastro:', error);
        return NextResponse.json(
            {
                message: 'Erro interno do servidor'
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
