require('dotenv').config();

console.log('=== Teste Simples de Banco ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Presente' : '❌ Ausente');

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');

async function testDB() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
  });
  
  try {
    console.log('📡 Conectando ao banco...');
    await prisma.$connect();
    console.log('✅ Conectado!');
    
    console.log('🔍 Testando query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query OK:', result);
    
    await prisma.$disconnect();
    console.log('🔌 Desconectado');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
  }
}

testDB();



