// Configurações de performance e cache
export const PERFORMANCE_CONFIG = {
    // Configurações do Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
    },

    // Configurações do banco de dados
    database: {
        connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '5'),
        poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10'),
        idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300'),
        statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '5000'),
    },

    // Timeouts da API
    timeouts: {
        apiRoute: parseInt(process.env.API_ROUTE_TIMEOUT_MS || '8000'),
        externalHttp: parseInt(process.env.EXTERNAL_HTTP_TIMEOUT_MS || '3000'),
        dbStatement: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '5000'),
    },

    // TTL do cache (em segundos)
    cacheTTL: {
        availability: parseInt(process.env.CACHE_TTL_AVAILABILITY || '60'),
        services: parseInt(process.env.CACHE_TTL_SERVICES || '300'),
        employees: parseInt(process.env.CACHE_TTL_EMPLOYEES || '300'),
        reporting: parseInt(process.env.CACHE_TTL_REPORTING || '300'),
        barbershop: parseInt(process.env.CACHE_TTL_BARBERSHOP || '60'),
    },

    // Configurações de retry
    retry: {
        read: {
            retries: 2,
            backoffMs: [50, 150],
            jitter: true,
        },
        write: {
            retries: 1,
            backoffMs: [100],
            jitter: true,
        },
    },

    // Configurações de monitoramento
    monitoring: {
        enableCacheMetrics: process.env.ENABLE_CACHE_METRICS === 'true',
        enableDbMetrics: process.env.ENABLE_DB_METRICS === 'true',
    },
} as const;

// Validação das configurações
export function validatePerformanceConfig() {
    const errors: string[] = [];

    // Validar configurações do Redis
    if (!PERFORMANCE_CONFIG.redis.host) {
        errors.push('REDIS_HOST is required');
    }

    if (PERFORMANCE_CONFIG.redis.port < 1 || PERFORMANCE_CONFIG.redis.port > 65535) {
        errors.push('REDIS_PORT must be between 1 and 65535');
    }

    // Validar configurações do banco
    if (PERFORMANCE_CONFIG.database.connectionLimit < 1) {
        errors.push('DATABASE_CONNECTION_LIMIT must be at least 1');
    }

    if (PERFORMANCE_CONFIG.database.poolTimeout < 1) {
        errors.push('DATABASE_POOL_TIMEOUT must be at least 1');
    }

    // Validar timeouts
    if (PERFORMANCE_CONFIG.timeouts.apiRoute < 1000) {
        errors.push('API_ROUTE_TIMEOUT_MS must be at least 1000ms');
    }

    if (PERFORMANCE_CONFIG.timeouts.dbStatement < 1000) {
        errors.push('DB_STATEMENT_TIMEOUT_MS must be at least 1000ms');
    }

    if (errors.length > 0) {
        throw new Error(`Performance configuration errors:\n${errors.join('\n')}`);
    }
}

// Inicializar validação
if (process.env.NODE_ENV === 'production') {
    validatePerformanceConfig();
}





