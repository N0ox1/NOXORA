import { Redis } from 'ioredis';
import { memoryCache } from './memory';

// Configuração do Redis
let redis: Redis | null = null;
let useMemoryCache = false;

// Verificar se Redis está disponível
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

// Tentar conectar ao Redis apenas se explicitamente configurado
if (process.env.REDIS_HOST || process.env.REDIS_URL) {
    try {
        redis = new Redis({
            host: redisHost,
            port: redisPort,
            password: process.env.REDIS_PASSWORD,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            connectTimeout: 10000,
            commandTimeout: 5000,
            // Configurar para não tentar reconectar automaticamente
            retryDelayOnClusterDown: 300,
            enableOfflineQueue: false,
        });

        // Adicionar listener de erro para evitar spam
        redis.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                console.warn('Redis connection refused, falling back to memory cache');
                useMemoryCache = true;
                redis = null;
            }
        });

        // Testar conexão
        redis.ping().catch(() => {
            console.warn('Redis not available, using memory cache fallback');
            useMemoryCache = true;
            redis = null;
        });

    } catch (error) {
        console.warn('Redis not available, using memory cache fallback');
        useMemoryCache = true;
    }
} else {
    // Se não há configuração de Redis, usar cache em memória
    console.log('No Redis configuration found, using memory cache');
    useMemoryCache = true;
}

// TTL por rota (em segundos)
export const TTL_MATRIX = {
    '/api/v1/barbershop/public/[slug]': 60,
    '/api/v1/availability?day=YYYY-MM-DD': 60,
    '/api/v1/services': 300,
    '/api/v1/employees': 300,
    '/api/v1/reporting/': 300,
} as const;

// Padrões de chaves Redis
export const CACHE_KEYS = {
    availability: (tenantId: string, barbershopId: string, day: string) =>
        `avl:${tenantId}:${barbershopId}:${day}`,
    servicesHot: (tenantId: string, barbershopId: string) =>
        `svc:${tenantId}:${barbershopId}:v1`,
    employeesHot: (tenantId: string, barbershopId: string) =>
        `emp:${tenantId}:${barbershopId}:v1`,
    publicShop: (tenantId: string, slug: string) =>
        `bs:${tenantId}:${slug}:v1`,
    reportingDaily: (tenantId: string, from: string, to: string) =>
        `rpt:daily:${tenantId}:${from}:${to}`,
    occupancyEmp: (tenantId: string, empId: string, from: string, to: string) =>
        `rpt:occ:${tenantId}:${empId}:${from}:${to}`,
} as const;

// Headers de cache
export const CACHE_HEADERS = {
    cacheControl: 's-maxage=60, stale-while-revalidate=120',
    diagnostics: {
        cacheSource: 'X-Cache-Source',
        vercelCache: 'X-Vercel-Cache',
    },
} as const;

// Interface para dados em cache
export interface CacheData<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Classe principal de cache
export class CacheService {
    private redis: Redis | null;
    private useMemory: boolean;

    constructor() {
        this.redis = redis;
        this.useMemory = useMemoryCache;
    }

    // Gerar chave de cache baseada na rota e parâmetros
    private makeKey(route: string, params: Record<string, any> = {}): string {
        const baseKey = route.replace(/\[([^\]]+)\]/g, (_, param) => params[param] || '');

        // Adicionar parâmetros de query se existirem
        const queryParams = Object.entries(params)
            .filter(([key, value]) => key !== 'tenantId' && value !== undefined)
            .map(([key, value]) => `${key}:${value}`)
            .join(':');

        return queryParams ? `${baseKey}:${queryParams}` : baseKey;
    }

    // Obter TTL para uma rota
    private getTTL(route: string): number {
        // Buscar TTL exato primeiro
        if (TTL_MATRIX[route as keyof typeof TTL_MATRIX]) {
            return TTL_MATRIX[route as keyof typeof TTL_MATRIX];
        }

        // Buscar por padrão
        for (const [pattern, ttl] of Object.entries(TTL_MATRIX)) {
            if (route.includes(pattern.replace('*', ''))) {
                return ttl;
            }
        }

        // TTL padrão
        return 300;
    }

    // Ler do cache (read-through pattern)
    async get<T>(route: string, params: Record<string, any> = {}): Promise<T | null> {
        try {
            const key = this.makeKey(route, params);

            if (this.useMemory) {
                return memoryCache.get<T>(key);
            }

            if (!this.redis) {
                return null;
            }

            const cached = await this.redis.get(key);

            if (!cached) {
                return null;
            }

            const parsed: CacheData<T> = JSON.parse(cached);

            // Verificar se não expirou
            const now = Date.now();
            if (now - parsed.timestamp > parsed.ttl * 1000) {
                await this.redis.del(key);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    // Escrever no cache
    async set<T>(route: string, data: T, params: Record<string, any> = {}): Promise<void> {
        try {
            const key = this.makeKey(route, params);
            const ttl = this.getTTL(route);

            if (this.useMemory) {
                await memoryCache.set(key, data, ttl);
                return;
            }

            if (!this.redis) {
                return;
            }

            const cacheData: CacheData<T> = {
                data,
                timestamp: Date.now(),
                ttl,
            };

            await this.redis.setex(key, ttl, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    // Invalidar cache por padrão
    async invalidate(pattern: string): Promise<void> {
        try {
            if (this.useMemory) {
                await memoryCache.invalidate(pattern);
                return;
            }

            if (!this.redis) {
                return;
            }

            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }

    // Invalidar múltiplos padrões
    async invalidateMultiple(patterns: string[]): Promise<void> {
        if (this.useMemory) {
            await memoryCache.invalidateMultiple(patterns);
            return;
        }

        await Promise.all(patterns.map(pattern => this.invalidate(pattern)));
    }

    // Obter com lock para evitar cache stampede
    async getWithLock<T>(
        route: string,
        params: Record<string, any>,
        fetcher: () => Promise<T>
    ): Promise<T> {
        if (this.useMemory) {
            return memoryCache.getWithLock(this.makeKey(route, params), fetcher);
        }

        const key = this.makeKey(route, params);
        const lockKey = `lock:${key}`;

        // Tentar obter do cache primeiro
        const cached = await this.get<T>(route, params);
        if (cached) {
            return cached;
        }

        if (!this.redis) {
            return fetcher();
        }

        // Tentar adquirir lock
        const lockAcquired = await this.redis.set(lockKey, '1', 'PX', 3000, 'NX');

        if (lockAcquired) {
            try {
                // Buscar dados
                const data = await fetcher();

                // Armazenar no cache
                await this.set(route, data, params);

                return data;
            } finally {
                // Liberar lock
                await this.redis.del(lockKey);
            }
        } else {
            // Aguardar um pouco e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 50));
            return this.getWithLock(route, params, fetcher);
        }
    }

    // Obter estatísticas do cache
    async getStats(): Promise<{
        hitRatio: number;
        totalKeys: number;
        memoryUsage: string;
    }> {
        try {
            if (this.useMemory) {
                return memoryCache.getStats();
            }

            if (!this.redis) {
                return {
                    hitRatio: 0,
                    totalKeys: 0,
                    memoryUsage: 'no-cache',
                };
            }

            const info = await this.redis.info('memory');
            const keyspace = await this.redis.info('keyspace');

            // Parsear informações básicas
            const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

            const dbMatch = keyspace.match(/db0:keys=(\d+)/);
            const totalKeys = dbMatch ? parseInt(dbMatch[1]) : 0;

            return {
                hitRatio: 0, // Seria calculado com métricas customizadas
                totalKeys,
                memoryUsage,
            };
        } catch (error) {
            console.error('Cache stats error:', error);
            return {
                hitRatio: 0,
                totalKeys: 0,
                memoryUsage: 'unknown',
            };
        }
    }

    // Fechar conexão
    async close(): Promise<void> {
        if (this.useMemory) {
            await memoryCache.close();
            return;
        }

        if (this.redis) {
            await this.redis.quit();
        }
    }
}

// Instância singleton
export const cacheService = new CacheService();

// Helper para adicionar headers de cache
export function addCacheHeaders(response: Response, source: 'db' | 'redis' = 'db'): Response {
    const headers = new Headers(response.headers);

    headers.set('Cache-Control', CACHE_HEADERS.cacheControl);
    headers.set(CACHE_HEADERS.diagnostics.cacheSource, source);
    headers.set(CACHE_HEADERS.diagnostics.vercelCache, source === 'redis' ? 'HIT' : 'MISS');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

// Helper para criar resposta com cache
export function createCachedResponse<T>(
    data: T,
    source: 'db' | 'redis' | 'memory' = 'db',
    status: number = 200
): Response {
    const response = new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Se estiver usando cache em memória, marcar como 'memory'
    const actualSource = useMemoryCache && source === 'redis' ? 'memory' : source;

    return addCacheHeaders(response, actualSource);
}
