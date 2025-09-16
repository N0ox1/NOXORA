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

// Handler para erros de conexão (apenas uma vez para evitar memory leak)
if (!global.prismaErrorHandlerAdded) {
  prisma.$on('error', (e) => {
    const errorMessage = e.message || '';

    // Filtrar erros de conexão fechada que são normais
    const isConnectionClosed = errorMessage.includes('closed') ||
      errorMessage.includes('Connection terminated') ||
      errorMessage.includes('Connection closed') ||
      errorMessage.includes('kind: Closed') ||
      errorMessage.includes('Connection was closed by the client') ||
      errorMessage.includes('Connection lost');

    // Em desenvolvimento: mostrar apenas erros importantes
    // Em produção: mostrar todos os erros (exceto connection closed)
    if (process.env.NODE_ENV === 'development') {
      if (!isConnectionClosed) {
        console.warn('Prisma: Erro de conexão detectado:', e.message);
      }
    } else {
      // Em produção, log todos os erros exceto connection closed
      if (!isConnectionClosed) {
        console.error('Prisma: Erro crítico de conexão:', e.message);
      } else {
        // Log silencioso para connection closed em produção
        console.debug('Prisma: Conexão fechada (normal)');
      }
    }
  });

  global.prismaErrorHandlerAdded = true;
}

// Handler para desconexões inesperadas (Prisma 5.0+) - apenas uma vez
if (!global.prismaProcessHandlersAdded) {
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

  global.prismaProcessHandlersAdded = true;
}

// Monitor de saúde da conexão (apenas em produção)
if (process.env.NODE_ENV === 'production') {
  let connectionErrors = 0;
  const maxErrors = 10;
  const resetInterval = 60000; // 1 minuto

  prisma.$on('error', (e) => {
    const errorMessage = e.message || '';
    const isConnectionClosed = errorMessage.includes('closed') ||
      errorMessage.includes('Connection terminated') ||
      errorMessage.includes('Connection closed') ||
      errorMessage.includes('kind: Closed');

    if (!isConnectionClosed) {
      connectionErrors++;
      console.error(`Prisma: Erro crítico #${connectionErrors}:`, e.message);

      if (connectionErrors >= maxErrors) {
        console.error('Prisma: Muitos erros de conexão detectados! Verificar configuração do banco.');
        // Aqui você poderia integrar com Sentry, DataDog, etc.
      }
    }
  });

  // Reset contador a cada minuto
  setInterval(() => {
    if (connectionErrors > 0) {
      console.log(`Prisma: Reset contador de erros (${connectionErrors} erros no último minuto)`);
      connectionErrors = 0;
    }
  }, resetInterval);
}

export default prisma;


