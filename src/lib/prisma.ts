import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_UQ6BezpiCk1Y@ep-dry-grass-acmjbtce-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=10&pool_timeout=60&connect_timeout=10"
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;


