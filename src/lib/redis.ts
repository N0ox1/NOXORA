// NOXORA: noop Redis para dev
// Quando for ativar Redis real, reverter para integração oficial

// Mock Redis para desenvolvimento
type KV = Record<string, string>;

class MockRedis {
  private l: Record<string,string[]> = {};
  private s: KV = {}; // string store
  private h: Record<string, KV> = {}; // hash store
  private z: Record<string, Array<{m: number, v: string}>> = {}; // sorted set store

  // String operations
  async get(key: string): Promise<string | null> {
    return this.s[key] ?? null;
  }

  async set(key: string, value: string): Promise<string> {
    this.s[key] = value;
    return 'OK';
  }

  async setex(key: string, ttl: number, value: string): Promise<string> {
    this.s[key] = value;
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys) {
      if (k in this.s) {
        delete this.s[k];
        n++;
      }
    }
    return n;
  }

  async incr(key: string): Promise<number> {
    const cur = parseInt(this.s[key] ?? '0');
    const nxt = cur + 1;
    this.s[key] = String(nxt);
    return nxt;
  }

  async exists(key: string): Promise<number> {
    return key in this.s ? 1 : 0;
  }

  async expire(key: string, ttl: number): Promise<number> {
    return key in this.s ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    return key in this.s ? 1 : -1;
  }

  async pexpire(key: string, ttl: number): Promise<number> {
    return this.expire(key, Math.ceil(ttl / 1000));
  }

  async pttl(key: string): Promise<number> {
    return this.ttl(key);
  }

  async info(section?: string): Promise<string> {
    return '# MockRedis info';
  }

  async keys(pattern: string): Promise<string[]> {
    const rx = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Object.keys(this.s).filter(k => rx.test(k));
  }

  // Pipeline operations
  // pipeline() { // Removido - duplicado

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    (this.h[key] ??= {})[field] = value;
    return 1;
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.h[key]?.[field] ?? null;
  }

  async hdel(key: string, field: string): Promise<number> {
    if (this.h[key] && field in this.h[key]) {
      delete this.h[key][field];
      return 1;
    }
    return 0;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return { ...(this.h[key] ?? {}) };
  }

  async hincrby(key: string, field: string, by: number): Promise<number> {
    const cur = parseInt(this.h[key]?.[field] ?? '0');
    const nxt = cur + by;
    await this.hset(key, field, String(nxt));
    return nxt;
  }

  // Sorted set operations
  async zadd(key: string, score: number, value: string): Promise<number> {
    (this.z[key] ??= []).push({m: score, v: value});
    this.z[key].sort((a, b) => a.m - b.m);
    return 1;
  }

  async zrange(key: string, start: number, stop: number, withscores?: string): Promise<string[]> {
    const arr = (this.z[key] ?? []).slice(start, stop === -1 ? undefined : stop + 1);
    if (withscores === 'WITHSCORES') {
      const out: string[] = [];
      for (const e of arr) {
        out.push(e.v, String(e.m));
      }
      return out;
    }
    return arr.map(e => e.v);
  }

  async zrem(key: string, value: string): Promise<number> {
    const arr = this.z[key] ?? [];
    const before = arr.length;
    this.z[key] = arr.filter(e => e.v !== value);
    return before - (this.z[key]?.length ?? 0);
  }

  async lpush(key:string, value:string){ (this.l[key]??=[]).unshift(value); return this.l[key].length }
  async rpop(key:string){ const a=this.l[key]??=[]; return a.pop() ?? null }
  async llen(key:string){ return (this.l[key]?.length) ?? 0 }
  // Duplicado removido pelo patch-guard
  // async exists(key:string){ return (key in this.s || key in this.h || key in this.z || key in this.l) ? 1 : 0 }
  async zremrangebyscore(key:string, min:number, max:number){ const arr=this.z[key]??[]; const before=arr.length; this.z[key]=arr.filter(e=>e.m<min || e.m>max); return before-(this.z[key]?.length??0) }
  async zcard(key:string){ return (this.z[key]?.length) ?? 0 }
  pipeline(){ const cmds:any=[]; return {
    zadd:(k:string,score:number,v:string)=>{cmds.push(()=>this.zadd(k,score,v));return this;},
    zremrangebyscore:(k:string,min:number,max:number)=>{cmds.push(()=>this.zremrangebyscore(k,min,max));return this;},
    zcard:(k:string)=>{cmds.push(()=>this.zcard(k));return this;},
    expire:(k:string,sec:number)=>{cmds.push(()=>this.expire(k,sec));return this;},
    exec: async()=>{ for(const f of cmds) await f(); return [] }
  } }

  async flushall(): Promise<void> {
    this.s = {};
    this.h = {};
    this.z = {};
    this.l = {};
  }

  async quit(): Promise<void> {
    // noop
  }
}

// Configuração do Redis (no-op para dev)
const redis = new MockRedis();

export { MockRedis };
export default redis;

// Configurações de cache
export const CACHE_CONFIG = {
  // TTL padrão para diferentes tipos de dados
  TTL: {
    PUBLIC_ROUTES: 60, // 60 segundos para rotas públicas
    BARBERSHOP: 60,    // 60 segundos para dados de barbearia
    SERVICES: 120,      // 2 minutos para serviços
    EMPLOYEES: 180,     // 3 minutos para funcionários
    CLIENTS: 300,       // 5 minutos para clientes
    APPOINTMENTS: 30,   // 30 segundos para agendamentos
    TENANT_INFO: 600,   // 10 minutos para informações do tenant
  },
  
  // Prefixos para diferentes tipos de cache
  PREFIXES: {
    BARBERSHOP: 'bs',
    SERVICE: 'srv',
    EMPLOYEE: 'emp',
    CLIENT: 'cli',
    APPOINTMENT: 'apt',
    TENANT: 'tnt',
    PUBLIC: 'pub',
  },
  
  // Headers de CDN
  CDN_HEADERS: {
    's-maxage': '60',
    'stale-while-revalidate': '120',
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  },
};

// Tipos para o sistema de cache
export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  serialize?: boolean;
}

export interface CacheResult<T> {
  data: T | null;
  source: 'cache' | 'database' | 'miss';
  ttl?: number;
}

// Classe principal de cache
export class CacheService {
  private redis: MockRedis;

  constructor() {
    this.redis = redis;
  }

  /**
   * Gera chave de cache estruturada
   */
  static generateKey(prefix: string, tenantId: string, identifier: string): string {
    return `${prefix}:${tenantId}:${identifier}`;
  }

  /**
   * Gera chave de cache para rotas públicas
   */
  static generatePublicKey(tenantId: string, slug: string): string {
    return `${CACHE_CONFIG.PREFIXES.BARBERSHOP}:${tenantId}:${slug}`;
  }

  /**
   * Gera chave de cache para serviços
   */
  static generateServiceKey(tenantId: string, serviceId: string): string {
    return `${CACHE_CONFIG.PREFIXES.SERVICE}:${tenantId}:${serviceId}`;
  }

  /**
   * Gera chave de cache para funcionários
   */
  static generateEmployeeKey(tenantId: string, employeeId: string): string {
    return `${CACHE_CONFIG.PREFIXES.EMPLOYEE}:${tenantId}:${employeeId}`;
  }

  /**
   * Gera chave de cache para clientes
   */
  static generateClientKey(tenantId: string, clientId: string): string {
    return `${CACHE_CONFIG.PREFIXES.CLIENT}:${tenantId}:${clientId}`;
  }

  /**
   * Gera chave de cache para agendamentos
   */
  static generateAppointmentKey(tenantId: string, appointmentId: string): string {
    return `${CACHE_CONFIG.PREFIXES.APPOINTMENT}:${tenantId}:${appointmentId}`;
  }

  /**
   * Gera chave de cache para informações do tenant
   */
  static generateTenantKey(tenantId: string): string {
    return `${CACHE_CONFIG.PREFIXES.TENANT}:${tenantId}`;
  }

  /**
   * Obtém dados do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Erro ao obter dados do cache:', error);
      return null;
    }
  }

  /**
   * Define dados no cache
   */
  async set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.TTL.PUBLIC_ROUTES): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      await this.redis.setex(key, ttl, serializedData);
    } catch (error) {
      console.error('Erro ao definir dados no cache:', error);
    }
  }

  /**
   * Remove dados do cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Erro ao remover dados do cache:', error);
    }
  }

  /**
   * Remove múltiplas chaves do cache
   */
  async delMultiple(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Erro ao remover múltiplas chaves do cache:', error);
    }
  }

  /**
   * Remove cache por padrão (ex: todos os serviços de um tenant)
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Erro ao remover cache por padrão:', error);
    }
  }

  /**
   * Verifica se chave existe no cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Erro ao verificar existência da chave:', error);
      return false;
    }
  }

  /**
   * Obtém TTL restante de uma chave
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error('Erro ao obter TTL:', error);
      return -1;
    }
  }

  /**
   * Renova TTL de uma chave
   */
  async renewTTL(key: string, ttl: number = CACHE_CONFIG.TTL.PUBLIC_ROUTES): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      console.error('Erro ao renovar TTL:', error);
    }
  }

  /**
   * Implementa cache read-through
   */
  async readThrough<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = CACHE_CONFIG.TTL.PUBLIC_ROUTES
  ): Promise<CacheResult<T>> {
    try {
      // 1. Tentar obter do cache
      const cachedData = await this.get<T>(key);
      
      if (cachedData !== null) {
        console.log(`🟢 Cache HIT: ${key}`);
        return {
          data: cachedData,
          source: 'cache',
          ttl: await this.getTTL(key),
        };
      }

      console.log(`🔴 Cache MISS: ${key}`);
      
      // 2. Se não estiver no cache, buscar da fonte
      const freshData = await fetchFunction();
      
      // 3. Armazenar no cache
      if (freshData !== null) {
        await this.set(key, freshData, ttl);
        console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      }

      return {
        data: freshData,
        source: 'database',
      };
    } catch (error) {
      console.error('Erro no read-through cache:', error);
      return {
        data: null,
        source: 'miss',
      };
    }
  }

  /**
   * Implementa cache write-through
   */
  async writeThrough<T>(
    key: string,
    data: T,
    ttl: number = CACHE_CONFIG.TTL.PUBLIC_ROUTES
  ): Promise<void> {
    try {
      await this.set(key, data, ttl);
      console.log(`💾 Cache WRITE-THROUGH: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('Erro no write-through cache:', error);
    }
  }

  /**
   * Implementa cache write-behind (assíncrono)
   */
  async writeBehind<T>(
    key: string,
    data: T,
    ttl: number = CACHE_CONFIG.TTL.PUBLIC_ROUTES
  ): Promise<void> {
    try {
      // Executa em background para não bloquear a resposta
      setImmediate(async () => {
        await this.set(key, data, ttl);
        console.log(`💾 Cache WRITE-BEHIND: ${key} (TTL: ${ttl}s)`);
      });
    } catch (error) {
      console.error('Erro no write-behind cache:', error);
    }
  }

  /**
   * Invalida cache relacionado
   */
  async invalidateRelated(tenantId: string, resourceType: string, resourceId?: string): Promise<void> {
    try {
      const patterns: string[] = [];

      switch (resourceType) {
        case 'barbershop':
          patterns.push(`${CACHE_CONFIG.PREFIXES.BARBERSHOP}:${tenantId}:*`);
          break;
        case 'service':
          patterns.push(`${CACHE_CONFIG.PREFIXES.SERVICE}:${tenantId}:*`);
          break;
        case 'employee':
          patterns.push(`${CACHE_CONFIG.PREFIXES.EMPLOYEE}:${tenantId}:*`);
          break;
        case 'client':
          patterns.push(`${CACHE_CONFIG.PREFIXES.CLIENT}:${tenantId}:*`);
          break;
        case 'appointment':
          patterns.push(`${CACHE_CONFIG.PREFIXES.APPOINTMENT}:${tenantId}:*`);
          break;
        case 'tenant':
          patterns.push(`${CACHE_CONFIG.PREFIXES.TENANT}:${tenantId}`);
          break;
        default:
          // Invalida todos os caches do tenant
          patterns.push(
            `${CACHE_CONFIG.PREFIXES.BARBERSHOP}:${tenantId}:*`,
            `${CACHE_CONFIG.PREFIXES.SERVICE}:${tenantId}:*`,
            `${CACHE_CONFIG.PREFIXES.EMPLOYEE}:${tenantId}:*`,
            `${CACHE_CONFIG.PREFIXES.CLIENT}:${tenantId}:*`,
            `${CACHE_CONFIG.PREFIXES.APPOINTMENT}:${tenantId}:*`
          );
      }

      for (const pattern of patterns) {
        await this.delByPattern(pattern);
      }

      console.log(`🗑️ Cache invalidado para tenant ${tenantId}, tipo ${resourceType}`);
    } catch (error) {
      console.error('Erro ao invalidar cache relacionado:', error);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    keysByPrefix: Record<string, number>;
  }> {
    try {
      // MockRedis não tem info('memory') ou keys('*')
      // Retorna valores padrão ou nulos
      return {
        totalKeys: 0,
        memoryUsage: 'N/A',
        hitRate: 0,
        keysByPrefix: {},
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do cache:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'N/A',
        hitRate: 0,
        keysByPrefix: {},
      };
    }
  }

  /**
   * Limpa todo o cache
   */
  async clearAll(): Promise<void> {
    try {
      await this.redis.flushall();
      console.log('🗑️ Cache completamente limpo');
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  /**
   * Fecha conexão com Redis
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Erro ao fechar conexão Redis:', error);
    }
  }
}

// Instância singleton do serviço de cache
export const cacheService = new CacheService();

// Função utilitária para obter headers de CDN
export function getCDNHeaders(ttl: number = CACHE_CONFIG.TTL.PUBLIC_ROUTES): Record<string, string> {
  return {
    'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
    's-maxage': ttl.toString(),
    'stale-while-revalidate': (ttl * 2).toString(),
    'Vary': 'X-Tenant-Id',
  };
}

// Função utilitária para obter headers de cache privado
export function getPrivateCacheHeaders(ttl: number = 300): Record<string, string> {
  return {
    'Cache-Control': `private, max-age=${ttl}`,
    'Vary': 'Authorization, X-Tenant-Id',
  };
}

// Função utilitária para obter headers sem cache
export function getNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

