require('dotenv').config();

console.log('=== Teste de Variáveis de Ambiente ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Presente' : '❌ Ausente');

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
}

if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET length:', process.env.JWT_SECRET.length);
  console.log('JWT_SECRET starts with:', process.env.JWT_SECRET.substring(0, 10) + '...');
}
