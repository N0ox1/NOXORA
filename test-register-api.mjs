import fetch from 'node-fetch';

async function testRegister() {
  try {
    console.log('🧪 Testando API de registro...');
    
    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Teste Usuário',
        email: 'teste@exemplo.com',
        phone: '(11) 99999-9999',
        password: '123456'
      })
    });

    const result = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📋 Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Registro funcionando!');
    } else {
      console.log('❌ Erro no registro:', result.message || result.error);
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
}

testRegister();
