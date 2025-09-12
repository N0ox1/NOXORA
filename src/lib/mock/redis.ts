type V = string | number | Record<string, any>;

class InMemoryRedis {
  private store = new Map<string, { v: any; exp?: number }>();
  
  private now() { return Date.now(); }
  
  async get(k: string): Promise<string | null> {
    const e = this.store.get(k);
    if (!e) return null;
    if (e.exp && e.exp < this.now()) { 
      this.store.delete(k); 
      return null; 
    }
    return typeof e.v === 'string' ? e.v : JSON.stringify(e.v);
  }
  
  async set(k: string, v: V, ttlSec?: number) {
    const exp = ttlSec ? this.now() + ttlSec * 1000 : undefined;
    this.store.set(k, { v, exp });
  }
  
  async setex(k: string, ttlSec: number, v: V) {
    return this.set(k, v, ttlSec);
  }
  
  async del(k: string) { 
    this.store.delete(k); 
  }
  
  async setnx(k: string, v: string, ttlSec?: number): Promise<boolean> {
    const exists = await this.get(k);
    if (exists !== null) return false;
    await this.set(k, v, ttlSec);
    return true;
  }
  
  async exists(k: string): Promise<number> {
    const e = this.store.get(k);
    if (!e) return 0;
    if (e.exp && e.exp < this.now()) { 
      this.store.delete(k); 
      return 0; 
    }
    return 1;
  }
  
  async incr(k: string): Promise<number> {
    const current = await this.get(k);
    const value = current ? parseInt(current) : 0;
    const newValue = value + 1;
    await this.set(k, newValue);
    return newValue;
  }
  
  async decr(k: string): Promise<number> {
    const current = await this.get(k);
    const value = current ? parseInt(current) : 0;
    const newValue = value - 1;
    await this.set(k, newValue);
    return newValue;
  }
  
  async expire(k: string, ttlSec: number): Promise<number> {
    const e = this.store.get(k);
    if (!e) return 0;
    const exp = this.now() + ttlSec * 1000;
    this.store.set(k, { ...e, exp });
    return 1;
  }
  
  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    // Implementação simples de pattern matching para "*"
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return allKeys.filter(key => regex.test(key));
    }
    return allKeys.filter(key => key === pattern);
  }
}

export const redis = new InMemoryRedis();

// --- helpers opcionais para stats/diagnóstico ---
// tamanho interno para fins de debug
// NÃO QUEBRA contratos existentes
// use cacheStats() para uma API estável
;(redis as any)._size = function(): number { 
  try { 
    return (redis as any).store?.size ?? -1; 
  } catch { 
    return -1; 
  } 
};

// Lock distribuído simulado para testes
export async function withLock(key: string, ttlSec: number, fn: () => Promise<any>) {
  const lockKey = `lock:${key}`;
  
  // Tentar adquirir o lock usando setnx (atomic)
  const acquired = await redis.setnx(lockKey, '1', ttlSec);
  
  if (!acquired) {
    throw Object.assign(new Error('LOCKED'), { code: 'LOCKED' });
  }
  
  try {
    return await fn();
  } finally {
    // Não remover o lock aqui - deixar expirar naturalmente
    // Isso simula melhor o comportamento de um lock distribuído real
  }
}
