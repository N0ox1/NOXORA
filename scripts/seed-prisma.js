#!/usr/bin/env node

/**
 * Script para inserir dados de seed usando Prisma
 * Este script lê o seeds.json e insere os dados no banco
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Carregar dados do seeds.json
const seedsPath = path.join(__dirname, '..', 'seeds.json');
const seedsData = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

async function seedDatabase() {
  console.log('🚀 Iniciando seed do banco de dados...');
  
  try {
    // 1. Inserir tenant
    console.log('📝 Inserindo tenant...');
    const newTenant = await prisma.tenant.upsert({
      where: { id: seedsData.tenants[0].id },
      update: {},
      create: {
        id: seedsData.tenants[0].id,
        name: seedsData.tenants[0].name,
        plan: seedsData.tenants[0].plan,
        status: seedsData.tenants[0].status,
      },
    });

    console.log('✅ Tenant inserido:', newTenant.name);

    // 2. Inserir barbershop
    console.log('📝 Inserindo barbershop...');
    const newBarbershop = await prisma.barbershop.upsert({
      where: { id: seedsData.barbershops[0].id },
      update: {},
      create: {
        id: seedsData.barbershops[0].id,
        tenantId: seedsData.barbershops[0].tenant_id,
        slug: seedsData.barbershops[0].slug,
        name: seedsData.barbershops[0].name,
        isActive: seedsData.barbershops[0].is_active,
      },
    });

    console.log('✅ Barbershop inserida:', newBarbershop.name);

    // 3. Inserir employee
    console.log('📝 Inserindo employee...');
    const newEmployee = await prisma.employee.upsert({
      where: { id: seedsData.employees[0].id },
      update: {},
      create: {
        id: seedsData.employees[0].id,
        tenantId: seedsData.employees[0].tenant_id,
        barbershopId: seedsData.employees[0].barbershop_id,
        name: seedsData.employees[0].name,
        role: seedsData.employees[0].role,
        active: seedsData.employees[0].active,
      },
    });

    console.log('✅ Employee inserido:', newEmployee.name);

    // 4. Inserir service
    console.log('📝 Inserindo service...');
    const newService = await prisma.service.upsert({
      where: { id: seedsData.services[0].id },
      update: {},
      create: {
        id: seedsData.services[0].id,
        tenantId: seedsData.services[0].tenant_id,
        barbershopId: seedsData.services[0].barbershop_id,
        name: seedsData.services[0].name,
        durationMin: seedsData.services[0].duration_min,
        priceCents: seedsData.services[0].price_cents,
        isActive: seedsData.services[0].is_active,
      },
    });

    console.log('✅ Service inserido:', newService.name);

    // 5. Inserir client
    console.log('📝 Inserindo client...');
    const newClient = await prisma.client.upsert({
      where: { id: seedsData.clients[0].id },
      update: {},
      create: {
        id: seedsData.clients[0].id,
        tenantId: seedsData.clients[0].tenant_id,
        name: seedsData.clients[0].name,
        phone: seedsData.clients[0].phone,
      },
    });

    console.log('✅ Client inserido:', newClient.name);

    // 6. Inserir appointment
    console.log('📝 Inserindo appointment...');
    const newAppointment = await prisma.appointment.upsert({
      where: { id: seedsData.appointments[0].id },
      update: {},
      create: {
        id: seedsData.appointments[0].id,
        tenantId: seedsData.appointments[0].tenant_id,
        barbershopId: seedsData.appointments[0].barbershop_id,
        employeeId: seedsData.appointments[0].employee_id,
        clientId: seedsData.appointments[0].client_id,
        serviceId: seedsData.appointments[0].service_id,
        status: seedsData.appointments[0].status,
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
        endAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // Amanhã + 30 min
      },
    });

    console.log('✅ Appointment inserido:', newAppointment.id);

    // 7. Verificar dados inseridos
    console.log('\n📊 Resumo dos dados inseridos:');
    const tenantCount = await prisma.tenant.count();
    const barbershopCount = await prisma.barbershop.count();
    const employeeCount = await prisma.employee.count();
    const serviceCount = await prisma.service.count();
    const clientCount = await prisma.client.count();
    const appointmentCount = await prisma.appointment.count();

    console.log(`   • Tenants: ${tenantCount}`);
    console.log(`   • Barbershops: ${barbershopCount}`);
    console.log(`   • Employees: ${employeeCount}`);
    console.log(`   • Services: ${serviceCount}`);
    console.log(`   • Clients: ${clientCount}`);
    console.log(`   • Appointments: ${appointmentCount}`);

    console.log('\n🎉 Seed do banco concluído com sucesso!');
    console.log('🔍 Dados disponíveis para testes e desenvolvimento');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Executar o seed se o script for chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
      console.log('✅ Script finalizado');
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ Erro fatal:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedDatabase };
