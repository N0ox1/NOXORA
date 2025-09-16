// Teste de conexão com o banco
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testConnection = async () => {
  try {
    console.log('Testando conexão com o banco...');
    
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão com banco OK');
    
    // Testar busca de serviços
    const services = await prisma.service.findMany({
      where: { tenantId: 'cmffwm0j20000uaoo2c4ugtvx' },
      take: 1
    });
    console.log('✅ Busca de serviços OK:', services.length);
    
    // Testar busca de funcionários
    const employees = await prisma.employee.findMany({
      where: { tenantId: 'cmffwm0j20000uaoo2c4ugtvx' },
      take: 1
    });
    console.log('✅ Busca de funcionários OK:', employees.length);
    
    // Testar busca de clientes
    const clients = await prisma.client.findMany({
      where: { tenantId: 'cmffwm0j20000uaoo2c4ugtvx' },
      take: 1
    });
    console.log('✅ Busca de clientes OK:', clients.length);
    
    // Testar criação de agendamento
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: 'cmffwm0j20000uaoo2c4ugtvx',
        clientId: 'cmfmw9pwm000duaio0jzo1las',
        employeeId: 'cmfg5i6jp0001uan0dtzv21b4',
        serviceId: 'cmfmrc9n70005ual4ifu436px',
        barbershopId: 'cmffwm0ks0002uaoot2x03802',
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 60000),
        notes: 'Teste direto no banco',
        status: 'PENDING'
      }
    });
    console.log('✅ Criação de agendamento OK:', appointment.id);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
};

testConnection();