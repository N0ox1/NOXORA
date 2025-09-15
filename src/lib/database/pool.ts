import { PrismaClient } from '@prisma/client';

// Configuração otimizada do pool de conexões
const createPrismaClient = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

// Singleton do Prisma com pool otimizado
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
    if (!prisma) {
        prisma = createPrismaClient();
    }
    return prisma;
}

// Configuração de timeouts para queries
export const QUERY_TIMEOUTS = {
    // Timeout para statements SQL (5 segundos)
    STATEMENT_TIMEOUT_MS: 5000,
    // Timeout para operações de API (8 segundos)
    API_ROUTE_TIMEOUT_MS: 8000,
    // Timeout para requisições HTTP externas (3 segundos)
    EXTERNAL_HTTP_TIMEOUT_MS: 3000,
} as const;

// Helper para executar queries com timeout
export async function executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = QUERY_TIMEOUTS.STATEMENT_TIMEOUT_MS
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // Configurar statement timeout no PostgreSQL
        const prisma = getPrismaClient();
        await prisma.$executeRaw`SET LOCAL statement_timeout = ${timeoutMs}`;

        const result = await operation();
        clearTimeout(timeoutId);
        return result;
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error(`Query timeout after ${timeoutMs}ms`);
        }

        throw error;
    }
}

// Política de retry para operações de leitura
export const RETRY_POLICY = {
    read: {
        retries: 2,
        backoffMs: [50, 150],
        jitter: true,
        retryOn: ['ETIMEDOUT', 'ECONNRESET', 'deadlock_detected'],
        neverRetryOn: ['unique_violation', 'check_violation'],
    },
    write: {
        retries: 1,
        backoffMs: [100],
        jitter: true,
        retryOn: ['ETIMEDOUT', 'ECONNRESET'],
        neverRetryOn: ['unique_violation', 'check_violation'],
        allowedIf: 'idempotent_key_present',
    },
} as const;

// Helper para retry com backoff exponencial
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    policy: typeof RETRY_POLICY.read | typeof RETRY_POLICY.write,
    context: string = 'unknown'
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= policy.retries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Verificar se deve retry
            if (attempt === policy.retries) {
                break;
            }

            // Verificar se não deve retry
            if (policy.neverRetryOn.some(code => error.code === code)) {
                break;
            }

            // Verificar se deve retry
            if (!policy.retryOn.some(code => error.code === code || error.message?.includes(code))) {
                break;
            }

            // Calcular delay com backoff e jitter
            const baseDelay = policy.backoffMs[Math.min(attempt, policy.backoffMs.length - 1)];
            const jitter = policy.jitter ? Math.random() * 0.1 * baseDelay : 0;
            const delay = baseDelay + jitter;

            console.log(`Retry ${attempt + 1}/${policy.retries} for ${context} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

// Wrapper para operações de leitura com retry
export async function readWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'read'
): Promise<T> {
    return retryWithBackoff(operation, RETRY_POLICY.read, context);
}

// Wrapper para operações de escrita com retry (apenas se idempotente)
export async function writeWithRetry<T>(
    operation: () => Promise<T>,
    isIdempotent: boolean = false,
    context: string = 'write'
): Promise<T> {
    if (!isIdempotent) {
        // Não retry para operações não idempotentes
        return operation();
    }

    return retryWithBackoff(operation, RETRY_POLICY.write, context);
}

// Monitoramento do pool
export async function getPoolStats() {
    const prisma = getPrismaClient();

    try {
        // Obter estatísticas do pool (se disponível)
        const stats = await prisma.$queryRaw`
      SELECT 
        state,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (now() - state_change))) as avg_duration_seconds
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    ` as Array<{
            state: string;
            count: number;
            avg_duration_seconds: number;
        }>;

        return {
            connections: stats,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Failed to get pool stats:', error);
        return {
            connections: [],
            timestamp: new Date().toISOString(),
            error: 'Failed to retrieve stats',
        };
    }
}

// Health check do banco
export async function healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
}> {
    const start = Date.now();

    try {
        const prisma = getPrismaClient();
        await prisma.$queryRaw`SELECT 1`;

        const latency = Date.now() - start;

        return {
            status: 'healthy',
            latency,
        };
    } catch (error: any) {
        const latency = Date.now() - start;

        return {
            status: 'unhealthy',
            latency,
            error: error.message,
        };
    }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
    if (prisma) {
        await prisma.$disconnect();
    }
}


