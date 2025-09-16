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

// Handler para erros de conexão removido - Prisma 5+ não suporta $on('error')

// Handler para desconexões inesperadas (Prisma 5.0+) - apenas uma vez
if (!(global as any).prismaProcessHandlersAdded) {
  process.on('beforeExit', async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Prisma: Aplicação sendo encerrada, desconectando banco...');
    }
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Prisma: SIGINT recebido, desconectando banco...');
    }
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Prisma: SIGTERM recebido, desconectando banco...');
    }
    await prisma.$disconnect();
    process.exit(0);
  });

  (global as any).prismaProcessHandlersAdded = true;
}

// Monitor de saúde da conexão removido - Prisma 5+ não suporta $on('error')

export default prisma;


