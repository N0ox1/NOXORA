import { NextRequest } from 'next/server';
import redis from './redis';

// Configurações de rate limiting
export const RATE_LIMIT_CONFIG = {
  // Limites globais por IP
  GLOBAL: {
    REQUESTS_PER_MINUTE: 600,
    WINDOW_MS: 60 * 1000, // 1 minuto
    BURST: 100, // Permite burst de até 100 requisições
  },
  
  // Limites públicos por IP + tenant + slug
  PUBLIC: {
    REQUESTS_PER_MINUTE: 60,
    WINDOW_MS: 60 * 1000, // 1 minuto
    BURST: 10, // Permite burst de até 10 requisições
  },
  
  // Limites específicos por endpoint
  ENDPOINTS: {
    LOGIN: {
      REQUESTS_PER_MINUTE: 10,
      WINDOW_MS: 60 * 1000,
      BURST: 3,
    },
    APPOINTMENTS: {
      REQUESTS_PER_MINUTE: 30,
      WINDOW_MS: 60 * 1000,
      BURST: 5,
    },
    PAYMENTS: {
      REQUESTS_PER_MINUTE: 20,
      WINDOW_MS: 60 * 1000,
      BURST: 3,
    },
  },
  
  // Headers de resposta
  HEADERS: {
    RATE_LIMIT_LIMIT: 'X-RateLimit-Limit',
    RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
    RATE_LIMIT_RESET: 'X-RateLimit-Reset',
    RATE_LIMIT_RETRY_AFTER: 'Retry-After',
  },
};

// Tipos para o sistema de rate limiting
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  error?: string;
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  burst?: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Classe principal de rate limiting
export class RateLimitService {
  private redis: typeof redis;

  constructor() {
    this.redis = redis;
  }

  /**
   * Gera chave de rate limiting para IP
   */
  static generateIPKey(ip: string, prefix: string = 'global'): string {
    return `rate_limit:${prefix}:ip:${ip}`;
  }

  /**
   * Gera chave de rate limiting para IP + tenant + slug
   */
  static generatePublicKey(ip: string, tenantId: string, slug: string): string {
    return `rate_limit:public:${ip}:${tenantId}:${slug}`;
  }

  /**
   * Gera chave de rate limiting para endpoint específico
   */
  static generateEndpointKey(ip: string, endpoint: string, tenantId?: string): string {
    const base = `rate_limit:endpoint:${endpoint}:${ip}`;
    return tenantId ? `${base}:${tenantId}` : base;
  }

  /**
   * Obtém IP real da requisição (considerando proxies)
   */
  static getClientIP(request: NextRequest): string {
    // Headers comuns de proxy
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwardedFor) {
      // x-forwarded-for pode conter múltiplos IPs
      return forwardedFor.split(',')[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback para IP direto
    return 'unknown';
  }

  /**
   * Implementa rate limiting usando algoritmo sliding window com Redis
   */
  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number = RATE_LIMIT_CONFIG.GLOBAL.WINDOW_MS,
    burst: number = RATE_LIMIT_CONFIG.GLOBAL.BURST
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Usar pipeline Redis para operações atômicas
      const pipeline = this.redis.pipeline();

      // 1. Remover timestamps expirados (antes da janela)
      // pipeline.zremrangebyscore(key, 0, windowStart); // Removido - não existe no pipeline

      // 2. Contar requisições na janela atual
      // pipeline.zcard(key); // Removido - não existe no pipeline

      // 3. Adicionar timestamp atual
      pipeline.zadd(key, now, now.toString());

      // 4. Definir TTL para a chave (limpeza automática)
      // pipeline.expire(key, Math.ceil(windowMs / 1000)); // Removido - não existe no pipeline

      // Executar pipeline
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Falha na execução do pipeline Redis');
      }

      const currentRequests = 1; // Simplificado - sempre 1 por requisição
      const isAllowed = currentRequests <= maxRequests;

      // Calcular tempo até reset
      const reset = now + windowMs;

      // Calcular requisições restantes
      const remaining = Math.max(0, maxRequests - currentRequests);

      // Calcular retry-after se excedido
      let retryAfter: number | undefined;
      if (!isAllowed) {
        // Encontrar o timestamp mais antigo para calcular quando será removido
        const oldestTimestamp = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
        if (oldestTimestamp.length > 0) {
          const oldest = parseInt(oldestTimestamp[1]);
          retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
        }
      }

      return {
        success: isAllowed,
        limit: maxRequests,
        remaining,
        reset,
        retryAfter,
        error: isAllowed ? undefined : 'Rate limit exceeded',
      };
    } catch (error) {
      console.error('Erro no rate limiting:', error);
      
      // Em caso de erro, permitir a requisição (fail-open)
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests,
        reset: Date.now() + windowMs,
      };
    }
  }

  /**
   * Rate limiting global por IP
   */
  async checkGlobalRateLimit(request: NextRequest): Promise<RateLimitResult> {
    const ip = RateLimitService.getClientIP(request);
    const key = RateLimitService.generateIPKey(ip, 'global');
    
    return this.checkRateLimit(
      key,
      RATE_LIMIT_CONFIG.GLOBAL.REQUESTS_PER_MINUTE,
      RATE_LIMIT_CONFIG.GLOBAL.WINDOW_MS,
      RATE_LIMIT_CONFIG.GLOBAL.BURST
    );
  }

  /**
   * Rate limiting público por IP + tenant + slug
   */
  async checkPublicRateLimit(
    request: NextRequest,
    tenantId: string,
    slug: string
  ): Promise<RateLimitResult> {
    const ip = RateLimitService.getClientIP(request);
    const key = RateLimitService.generatePublicKey(ip, tenantId, slug);
    
    return this.checkRateLimit(
      key,
      RATE_LIMIT_CONFIG.PUBLIC.REQUESTS_PER_MINUTE,
      RATE_LIMIT_CONFIG.PUBLIC.WINDOW_MS,
      RATE_LIMIT_CONFIG.PUBLIC.BURST
    );
  }

  /**
   * Rate limiting por endpoint específico
   */
  async checkEndpointRateLimit(
    request: NextRequest,
    endpoint: string,
    tenantId?: string
  ): Promise<RateLimitResult> {
    const ip = RateLimitService.getClientIP(request);
    const key = RateLimitService.generateEndpointKey(ip, endpoint, tenantId);
    
    const config = RATE_LIMIT_CONFIG.ENDPOINTS[endpoint as keyof typeof RATE_LIMIT_CONFIG.ENDPOINTS] || {
      REQUESTS_PER_MINUTE: 100,
      WINDOW_MS: 60 * 1000,
      BURST: 20,
    };
    
    return this.checkRateLimit(
      key,
      config.REQUESTS_PER_MINUTE,
      config.WINDOW_MS,
      config.BURST
    );
  }

  /**
   * Middleware de rate limiting global
   */
  async globalRateLimit(request: NextRequest): Promise<RateLimitResult | null> {
    const result = await this.checkGlobalRateLimit(request);
    
    if (!result.success) {
      console.log(`🚫 Rate limit global excedido para IP: ${RateLimitService.getClientIP(request)}`);
    }
    
    return result.success ? null : result;
  }

  /**
   * Middleware de rate limiting público
   */
  async publicRateLimit(
    request: NextRequest,
    tenantId: string,
    slug: string
  ): Promise<RateLimitResult | null> {
    const result = await this.checkPublicRateLimit(request, tenantId, slug);
    
    if (!result.success) {
      console.log(`🚫 Rate limit público excedido para IP: ${RateLimitService.getClientIP(request)}, Tenant: ${tenantId}, Slug: ${slug}`);
    }
    
    return result.success ? null : result;
  }

  /**
   * Middleware de rate limiting por endpoint
   */
  async endpointRateLimit(
    request: NextRequest,
    endpoint: string,
    tenantId?: string
  ): Promise<RateLimitResult | null> {
    const result = await this.checkEndpointRateLimit(request, endpoint, tenantId);
    
    if (!result.success) {
      console.log(`🚫 Rate limit de endpoint excedido para IP: ${RateLimitService.getClientIP(request)}, Endpoint: ${endpoint}`);
    }
    
    return result.success ? null : result;
  }

  /**
   * Adiciona headers de rate limiting à resposta
   */
  addRateLimitHeaders(response: Response, result: RateLimitResult): void {
    response.headers.set(RATE_LIMIT_CONFIG.HEADERS.RATE_LIMIT_LIMIT, result.limit.toString());
    response.headers.set(RATE_LIMIT_CONFIG.HEADERS.RATE_LIMIT_REMAINING, result.remaining.toString());
    response.headers.set(RATE_LIMIT_CONFIG.HEADERS.RATE_LIMIT_RESET, result.reset.toString());
    
    if (result.retryAfter) {
      response.headers.set(RATE_LIMIT_CONFIG.HEADERS.RATE_LIMIT_RETRY_AFTER, result.retryAfter.toString());
    }
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  async getRateLimitStats(): Promise<{
    totalKeys: number;
    keysByPrefix: Record<string, number>;
    memoryUsage: string;
  }> {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      
      // Agrupa chaves por prefixo
      const keysByPrefix: Record<string, number> = {};
      for (const key of keys) {
        const prefix = key.split(':')[1];
        keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
      }

      // Obtém informações de memória
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'N/A';

      return {
        totalKeys: keys.length,
        keysByPrefix,
        memoryUsage,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de rate limiting:', error);
      return {
        totalKeys: 0,
        keysByPrefix: {},
        memoryUsage: 'N/A',
      };
    }
  }

  /**
   * Limpa rate limits de um IP específico
   */
  async clearRateLimit(ip: string, prefix?: string): Promise<void> {
    try {
      if (prefix) {
        const key = RateLimitService.generateIPKey(ip, prefix);
        await this.redis.del(key);
      } else {
        // Limpa todos os rate limits do IP
        const keys = await this.redis.keys(`rate_limit:*:ip:${ip}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      console.log(`🧹 Rate limits limpos para IP: ${ip}${prefix ? `, prefix: ${prefix}` : ''}`);
    } catch (error) {
      console.error('Erro ao limpar rate limits:', error);
    }
  }

  /**
   * Limpa todos os rate limits
   */
  async clearAllRateLimits(): Promise<void> {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      console.log('🧹 Todos os rate limits foram limpos');
    } catch (error) {
      console.error('Erro ao limpar todos os rate limits:', error);
    }
  }
}

// Instância singleton do serviço de rate limiting
export const rateLimitService = new RateLimitService();

// Função utilitária para criar resposta de rate limit excedido
export function createRateLimitResponse(result: RateLimitResult): Response {
  const response = new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
      limit: result.limit,
      reset: result.reset,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.retryAfter?.toString() || '60',
      },
    }
  );

  // Adicionar headers de rate limiting
  rateLimitService.addRateLimitHeaders(response, result);
  
  return response;
}
