#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('🔄 Testando conexão com o banco de dados...');

        // Testar conexão básica
        await prisma.$connect();
        console.log('✅ Conexão com banco estabelecida!');

        // Testar listagem de tenants
        console.log('🔄 Testando listagem de tenants...');
        const tenants = await prisma.tenant.findMany();
        console.log(`✅ Encontrados ${tenants.length} tenants`);

        // Testar listagem de barbershops
        console.log('🔄 Testando listagem de barbershops...');
        const barbershops = await prisma.barbershop.findMany();
        console.log(`✅ Encontrados ${barbershops.length} barbershops`);

        // Testar listagem de employees
        console.log('🔄 Testando listagem de employees...');
        const employees = await prisma.employee.findMany({
            take: 5
        });
        console.log(`✅ Encontrados ${employees.length} employees`);

        console.log('🎉 Todos os testes passaram! Banco configurado corretamente.');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
