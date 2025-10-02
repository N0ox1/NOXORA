import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantId, login, password } = body;

        console.log('🔍 Login temporário:', { tenantId, login, password: '***' });

        // Dados hardcoded temporariamente para testar
        const testClient = {
            id: 'cmfx4721f0005uaswuw0u60j3',
            tenantId: 'cmfx4721f0005uaswuw0u60j3',
            name: 'Vinicius',
            email: 'viniciusxiste079@gmail.com',
            phone: null,
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J/8K8K8K8' // hash de 'Vitor160201!'
        };

        // Verificar se é o cliente correto
        if (login === testClient.email && tenantId === testClient.tenantId) {
            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, testClient.passwordHash);

            if (isValidPassword) {
                const jwtSecret = process.env.JWT_SECRET;
                if (!jwtSecret) {
                    return NextResponse.json({ ok: false, error: 'server_misconfig' }, { status: 500 });
                }

                const token = jwt.sign({ clientId: testClient.id, tenantId }, jwtSecret, { expiresIn: '30d' });

                const res = NextResponse.json({
                    ok: true,
                    client: {
                        id: testClient.id,
                        name: testClient.name,
                        email: testClient.email,
                        phone: testClient.phone
                    }
                });

                res.cookies.set('client-auth', token, {
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30,
                });

                return res;
            }
        }

        return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });

    } catch (error) {
        console.error('❌ Erro no login temporário:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
}


