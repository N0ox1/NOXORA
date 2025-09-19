import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// URL do banco com configurações otimizadas para Neon
// Prioriza a URL do Neon. Se a variável de ambiente apontar para um Postgres local (ex: usuário "postgres" ou host "localhost"),
// usamos o fallback do Neon para evitar credenciais inválidas derrubarem o servidor em dev.
// Força URL do Neon em dev para evitar confusão com .env local
const databaseUrl = "postgresql://neondb_owner:npg_UQ6BezpiCk1Y@ep-dry-grass-acmjbtce-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=10&pool_timeout=60&connect_timeout=10";

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

// Não registramos handlers de sinal em dev para evitar logs e encerramentos inesperados

export default prisma;


