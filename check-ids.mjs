// Verificar IDs existentes no banco
const checkIds = async () => {
  try {
    console.log('Verificando serviços...');
    const servicesResponse = await fetch('http://localhost:3000/api/v1/services', {
      headers: { 'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx' }
    });
    
    if (servicesResponse.ok) {
      const services = await servicesResponse.json();
      console.log('Serviços encontrados:', services);
    } else {
      console.log('Erro ao buscar serviços:', servicesResponse.status);
    }

    console.log('\nVerificando funcionários...');
    const employeesResponse = await fetch('http://localhost:3000/api/v1/employees', {
      headers: { 'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx' }
    });
    
    if (employeesResponse.ok) {
      const employees = await employeesResponse.json();
      console.log('Funcionários encontrados:', employees);
    } else {
      console.log('Erro ao buscar funcionários:', employeesResponse.status);
    }

  } catch (error) {
    console.error('Erro:', error);
  }
};

checkIds();
