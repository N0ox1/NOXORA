// Teste de criação de agendamento
const testAppointment = async () => {
  try {
    console.log('1. Testando criação de cliente...');
    
    const clientResponse = await fetch('http://localhost:3000/api/v1/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
      },
      body: JSON.stringify({
        name: 'Teste Cliente',
        phone: '11999999999',
        email: 'teste@teste.com'
      })
    });

    console.log('Status do cliente:', clientResponse.status);
    
    if (!clientResponse.ok) {
      const error = await clientResponse.json();
      console.error('Erro ao criar cliente:', error);
      return;
    }

    const client = await clientResponse.json();
    console.log('Cliente criado:', client);

    console.log('2. Testando criação de agendamento...');
    
    const appointmentResponse = await fetch('http://localhost:3000/api/v1/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
      },
      body: JSON.stringify({
        clientId: client.client.id,
        employeeId: 'cmfg5i6jp0001uan0dtzv21b4', // ID de funcionário real
        serviceId: 'cmfmrc9n70005ual4ifu436px', // ID de serviço real
        barbershopId: 'cmffwm0ks0002uaoot2x03802',
        scheduledAt: new Date().toISOString(),
        notes: 'Teste de agendamento'
      })
    });

    console.log('Status do agendamento:', appointmentResponse.status);
    
    if (!appointmentResponse.ok) {
      const error = await appointmentResponse.json();
      console.error('Erro ao criar agendamento:', error);
      return;
    }

    const appointment = await appointmentResponse.json();
    console.log('Agendamento criado:', appointment);

    console.log('3. Testando listagem de agendamentos...');
    
    const listResponse = await fetch('http://localhost:3000/api/v1/appointments/list?start=2024-01-01&end=2025-12-31', {
      headers: { 'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx' }
    });

    console.log('Status da listagem:', listResponse.status);
    
    if (!listResponse.ok) {
      const error = await listResponse.json();
      console.error('Erro ao listar agendamentos:', error);
      return;
    }

    const appointments = await listResponse.json();
    console.log('Agendamentos encontrados:', appointments);

  } catch (error) {
    console.error('Erro geral:', error);
  }
};

testAppointment();
