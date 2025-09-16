import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// URL do banco com configurações otimizadas para Neon
const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_UQ6BezpiCk1Y@ep-dry-grass-acmjbtce-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=10&pool_timeout=60&connect_timeout=10";

// Função para criar instância do Prisma com configurações otimizadas
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
}

// Singleton pattern para evitar múltiplas instâncias
export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Handler para erros de conexão (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('error', (e) => {
    // Filtrar apenas erros importantes, ignorar "connection closed"
    if (!e.message?.includes('closed') && !e.message?.includes('Connection terminated')) {
      console.warn('Prisma: Erro de conexão detectado:', e.message);
    }
  });

  // Handler para desconexões inesperadas (Prisma 5.0+)
  process.on('beforeExit', async () => {
    console.log('Prisma: Aplicação sendo encerrada, desconectando banco...');
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    console.log('Prisma: SIGINT recebido, desconectando banco...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Prisma: SIGTERM recebido, desconectando banco...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default prisma;


