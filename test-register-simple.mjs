const testData = {
    name: 'João Silva',
    email: 'joao.novo@teste.com',
    phone: '(11) 88888-8888',
    businessName: 'Barbearia João'
};

fetch('http://localhost:3000/api/v1/auth/register-step1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
})
    .then(r => r.json())
    .then(d => console.log('Resposta:', d))
    .catch(e => console.error('Erro:', e));
