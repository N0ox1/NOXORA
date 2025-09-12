import { cacheReadThrough } from '@/lib/cache';

// Teste simples da API pública de barbershop
export async function testPublicBarbershopAPI() {
  console.log('=== Teste da API Pública de Barbershop ===\n');

  // 1. Configurar dados de teste
  console.log('1. Configurando dados de teste:');
  
  const testTenantId = 'tnt_1';
  const testSlug = 'barber-labs-centro';
  
  console.log(`  - Tenant ID: ${testTenantId}`);
  console.log(`  - Slug: ${testSlug}`);

  // 2. Instruções para testar a API
  console.log('\n2. Para testar a API, execute:');
  
  console.log('\n   Teste sem X-Tenant-Id (deve retornar 400):');
  console.log(`   curl "http://localhost:3000/api/barbershop/public/${testSlug}"`);
  
  console.log('\n   Teste com X-Tenant-Id válido (deve retornar 200):');
  console.log(`   curl -H "X-Tenant-Id: ${testTenantId}" "http://localhost:3000/api/barbershop/public/${testSlug}"`);
  
  console.log('\n   Teste com slug inexistente (deve retornar 404):');
  console.log(`   curl -H "X-Tenant-Id: ${testTenantId}" "http://localhost:3000/api/barbershop/public/slug-inexistente"`);
  
  console.log('\n3. Ou use PowerShell:');
  
  console.log('\n   Teste sem X-Tenant-Id (deve retornar 400):');
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/barbershop/public/${testSlug}"`);
  
  console.log('\n   Teste com X-Tenant-Id válido (deve retornar 200):');
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/barbershop/public/${testSlug}" -Headers @{"X-Tenant-Id"="${testTenantId}"}`);
  
  console.log('\n   Teste com slug inexistente (deve retornar 404):');
  console.log(`   Invoke-RestMethod -Uri "http://localhost:3000/api/barbershop/public/slug-inexistente" -Headers @{"X-Tenant-Id"="${testTenantId}"}`);

  // 3. Verificar cache funcionando
  console.log('\n4. Para testar o cache:');
  console.log('   - Execute o mesmo comando duas vezes');
  console.log('   - Primeira vez: X-Cache-Source: db');
  console.log('   - Segunda vez: X-Cache-Source: redis');
  console.log('   - Verifique o header Cache-Control: s-maxage=60, stale-while-revalidate=120');

  console.log('\n=== Teste da API configurado ===');
  console.log('Execute os comandos acima para verificar se a API está funcionando.');
  console.log('\nDica: Use o DevTools do navegador ou curl -v para ver os headers!');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testPublicBarbershopAPI().catch(console.error);
}
