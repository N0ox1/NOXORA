// Teste simples de criação de agendamento
const testSimpleAppointment = async () => {
  try {
    console.log('Testando criação de agendamento simples...');
    
    const appointmentResponse = await fetch('http://localhost:3000/api/v1/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
      },
      body: JSON.stringify({
        clientId: 'cmfmw9pwm000duaio0jzo1las', // Cliente criado anteriormente
        employeeId: 'cmfg5i6jp0001uan0dtzv21b4', // Funcionário real
        serviceId: 'cmfmrc9n70005ual4ifu436px', // Serviço real
        barbershopId: 'cmffwm0ks0002uaoot2x03802',
        scheduledAt: new Date().toISOString(),
        notes: 'Teste simples'
      })
    });

    console.log('Status:', appointmentResponse.status);
    console.log('Headers:', Object.fromEntries(appointmentResponse.headers.entries()));
    
    const text = await appointmentResponse.text();
    console.log('Response text:', text);
    
    if (text) {
      try {
        const json = JSON.parse(text);
        console.log('Response JSON:', json);
      } catch (e) {
        console.log('Não é JSON válido');
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  }
};

testSimpleAppointment();
