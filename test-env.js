require('dotenv').config();

console.log('=== Teste de Variáveis de Ambiente ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Presente' : '❌ Ausente');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL: ✅ Configurado');
}

if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET: ✅ Configurado');
}
