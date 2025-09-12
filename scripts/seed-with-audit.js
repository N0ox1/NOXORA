#!/usr/bin/env node

/**
 * Script para inserir dados de seed com auditoria automática
 * Este script lê o seeds.json e insere os dados usando o sistema de auditoria
 */

const { db } = require('../src/lib/db');
const { auditService } = require('../src/lib/audit');
const { tenants, barbershops, employees, services, clients, appointments } = require('../src/lib/db/schema');
const { eq } = require('drizzle-orm');
const fs = require('fs');
const path = require('path');

// Carregar dados do seeds.json
const seedsPath = path.join(__dirname, 'seeds.json');
const seedsData = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

async function seedWithAudit() {
  console.log('🚀 Iniciando seed com auditoria...');
  
  try {
    // 1. Inserir tenant
    console.log('📝 Inserindo tenant...');
    const newTenant = await db.insert(tenants).values({
      id: seedsData.tenants[0].id,
      name: seedsData.tenants[0].name,
      plan: seedsData.tenants[0].plan,
      status: seedsData.tenants[0].status,
    }).returning();

    // Log de auditoria para tenant
    await auditService.log(
      {
        tenant_id: newTenant[0].id,
        actor_id: 'system',
        actor_type: 'system',
        actor_name: 'Sistema de Seed',
        actor_email: 'seed@noxora.com',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script',
        session_id: 'seed_session',
        request_id: `seed_${Date.now()}`,
        timestamp: new Date(),
      },
      'CREATE',
      'tenant',
      newTenant[0].id,
      [
        { field: 'name', old_value: null, new_value: newTenant[0].name },
        { field: 'plan', old_value: null, new_value: newTenant[0].plan },
        { field: 'status', old_value: null, new_value: newTenant[0].status },
      ],
      { source: 'seed_script', priority: 'medium' }
    );

    console.log('✅ Tenant inserido:', newTenant[0].name);

    // 2. Inserir barbershop
    console.log('📝 Inserindo barbershop...');
    const newBarbershop = await db.insert(barbershops).values({
      id: seedsData.barbershops[0].id,
      tenantId: seedsData.barbershops[0].tenant_id,
      slug: seedsData.barbershops[0].slug,
      name: seedsData.barbershops[0].name,
      isActive: seedsData.barbershops[0].is_active,
    }).returning();

    // Log de auditoria para barbershop
    await auditService.log(
      {
        tenant_id: newBarbershop[0].tenantId,
        actor_id: 'system',
        actor_type: 'system',
        actor_name: 'Sistema de Seed',
        actor_email: 'seed@noxora.com',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script',
        session_id: 'seed_session',
        request_id: `seed_${Date.now()}`,
        timestamp: new Date(),
      },
      'CREATE',
      'barbershop',
      newBarbershop[0].id,
      [
        { field: 'name', old_value: null, new_value: newBarbershop[0].name },
        { field: 'slug', old_value: null, new_value: newBarbershop[0].slug },
        { field: 'is_active', old_value: null, new_value: newBarbershop[0].isActive },
      ],
      { source: 'seed_script', priority: 'medium' }
    );

    console.log('✅ Barbershop inserida:', newBarbershop[0].name);

    // 3. Inserir employee
    console.log('📝 Inserindo employee...');
    const newEmployee = await db.insert(employees).values({
      id: seedsData.employees[0].id,
      tenantId: seedsData.employees[0].tenant_id,
      barbershopId: seedsData.employees[0].barbershop_id,
      name: seedsData.employees[0].name,
      role: seedsData.employees[0].role,
      active: seedsData.employees[0].active,
    }).returning();

    // Log de auditoria para employee
    await auditService.log(
      {
        tenant_id: newEmployee[0].tenantId,
        actor_id: 'system',
        actor_type: 'system',
        actor_name: 'Sistema de Seed',
        actor_email: 'seed@noxora.com',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script',
        session_id: 'seed_session',
        request_id: `seed_${Date.now()}`,
        timestamp: new Date(),
      },
      'CREATE',
      'employee',
      newEmployee[0].id,
      [
        { field: 'name', old_value: null, new_value: newEmployee[0].name },
        { field: 'role', old_value: null, new_value: newEmployee[0].role },
        { field: 'active', old_value: null, new_value: newEmployee[0].active },
      ],
      { source: 'seed_script', priority: 'medium' }
    );

    console.log('✅ Employee inserido:', newEmployee[0].name);

    // 4. Inserir service
    console.log('📝 Inserindo service...');
    const newService = await db.insert(services).values({
      id: seedsData.services[0].id,
      tenantId: seedsData.services[0].tenant_id,
      barbershopId: seedsData.services[0].barbershop_id,
      name: seedsData.services[0].name,
      durationMin: seedsData.services[0].duration_min,
      priceCents: seedsData.services[0].price_cents,
      isActive: seedsData.services[0].is_active,
    }).returning();

    // Log de auditoria para service
    await auditService.log(
      {
        tenant_id: newService[0].tenantId,
        actor_id: 'system',
        actor_type: 'system',
        actor_name: 'Sistema de Seed',
        actor_email: 'seed@noxora.com',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script',
        session_id: 'seed_session',
        request_id: `seed_${Date.now()}`,
        timestamp: new Date(),
      },
      'CREATE',
      'service',
      newService[0].id,
      [
        { field: 'name', old_value: null, new_value: newService[0].name },
        { field: 'duration_min', old_value: null, new_value: newService[0].durationMin },
        { field: 'price_cents', old_value: null, new_value: newService[0].priceCents },
        { field: 'is_active', old_value: null, new_value: newService[0].isActive },
      ],
      { source: 'seed_script', priority: 'medium' }
    );

    console.log('✅ Service inserido:', newService[0].name);

    // 5. Inserir client
    console.log('📝 Inserindo client...');
    const newClient = await db.insert(clients).values({
      id: seedsData.clients[0].id,
      tenantId: seedsData.clients[0].tenant_id,
      name: seedsData.clients[0].name,
      phone: seedsData.clients[0].phone,
    }).returning();

    // Log de auditoria para client
    await auditService.log(
      {
        tenant_id: newClient[0].tenantId,
        actor_id: 'system',
        actor_type: 'system',
        actor_name: 'Sistema de Seed',
        actor_email: 'seed@noxora.com',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script',
        session_id: 'seed_session',
        request_id: `seed_${Date.now()}`,
        timestamp: new Date(),
      },
      'CREATE',
      'client',
      newClient[0].id,
      [
        { field: 'name', old_value: null, new_value: newClient[0].name },
        { field: 'phone', old_value: null, new_value: newClient[0].phone },
      ],
      { source: 'seed_script', priority: 'medium' }
    );

    console.log('✅ Client inserido:', newClient[0].name);

    // 6. Inserir appointment
    console.log('📝 Inserindo appointment...');
    const newAppointment = await db.insert(appointments).values({
      id: seedsData.appointments[0].id,
      tenantId: seedsData.appointments[0].tenant_id,
      barbershopId: seedsData.appointments[0].barbershop_id,
      employeeId: seedsData.appointments[0].employee_id,
      clientId: seedsData.appointments[0].client_id,
      serviceId: seedsData.appointments[0].service_id,
      status: seedsData.appointments[0].status,
    }).returning();

    // Log de auditoria para appointment
    await auditService.log(
      {
        tenant_id: newAppointment[0].tenantId,
        actor_id: 'system',
        actor_type: 'system',
        actor_name: 'Sistema de Seed',
        actor_email: 'seed@noxora.com',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script',
        session_id: 'seed_session',
        request_id: `seed_${Date.now()}`,
        timestamp: new Date(),
      },
      'CREATE',
      'appointment',
      newAppointment[0].id,
      [
        { field: 'status', old_value: null, new_value: newAppointment[0].status },
        { field: 'employee_id', old_value: null, new_value: newAppointment[0].employeeId },
        { field: 'client_id', old_value: null, new_value: newAppointment[0].clientId },
        { field: 'service_id', old_value: null, new_value: newAppointment[0].serviceId },
      ],
      { source: 'seed_script', priority: 'medium' }
    );

    console.log('✅ Appointment inserido:', newAppointment[0].id);

    // 7. Log de auditoria para confirmação do appointment
    console.log('📝 Registrando confirmação do appointment...');
    await auditService.log(
      {
        tenant_id: newAppointment[0].tenantId,
        actor_id: 'system',
        actor_type: 'system',
        actor_name: 'Sistema de Seed',
        actor_email: 'seed@noxora.com',
        ip_address: '127.0.0.1',
        user_agent: 'Seed Script',
        session_id: 'seed_session',
        request_id: `seed_${Date.now()}`,
        timestamp: new Date(),
      },
      'UPDATE',
      'appointment',
      newAppointment[0].id,
      [
        { field: 'status', old_value: 'PENDING', new_value: 'CONFIRMED' },
      ],
      { 
        source: 'seed_script', 
        priority: 'medium',
        action_type: 'confirmation',
        timestamp: new Date().toISOString()
      }
    );

    console.log('✅ Confirmação do appointment registrada');

    // 8. Verificar dados inseridos
    console.log('\n📊 Resumo dos dados inseridos:');
    const tenantCount = await db.select().from(tenants);
    const barbershopCount = await db.select().from(barbershops);
    const employeeCount = await db.select().from(employees);
    const serviceCount = await db.select().from(services);
    const clientCount = await db.select().from(clients);
    const appointmentCount = await db.select().from(appointments);

    console.log(`   • Tenants: ${tenantCount.length}`);
    console.log(`   • Barbershops: ${barbershopCount.length}`);
    console.log(`   • Employees: ${employeeCount.length}`);
    console.log(`   • Services: ${serviceCount.length}`);
    console.log(`   • Clients: ${clientCount.length}`);
    console.log(`   • Appointments: ${appointmentCount.length}`);

    console.log('\n🎉 Seed com auditoria concluído com sucesso!');
    console.log('🔍 Verifique os logs de auditoria em: http://localhost:3000/audit');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

// Executar o seed se o script for chamado diretamente
if (require.main === module) {
  seedWithAudit()
    .then(() => {
      console.log('✅ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedWithAudit };
