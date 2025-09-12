import { redis } from '@/lib/mock/redis';

/** Read-through cache genérico */
export async function cacheReadThrough<T>(key: string, ttlSec: number, loader: () => Promise<T>): Promise<{ data: T; source: 'redis' | 'db' }> {
  const cached = await redis.get(key);
  if (cached) return { data: JSON.parse(cached), source: 'redis' };
  const data = await loader();
  await redis.set(key, data as any, ttlSec);
  return { data, source: 'db' };
}

/** Cache manual simples */
export async function cacheSet(key: string, value: any, ttlSec?: number) { 
  await redis.set(key, value, ttlSec); 
}

export async function cacheGet<T = any>(key: string): Promise<T | null> { 
  const v = await redis.get(key); 
  return v ? JSON.parse(v) as T : null; 
}

export async function cacheDel(key: string) { 
  await redis.del(key); 
}

/** Utilitário para compor chaves com segurança de tipos */
export function cacheKey(parts: Array<string | number | boolean | null | undefined>): string {
  return parts.map(p => (p === null || p === undefined ? '' : String(p))).join(':');
}

/** Estatísticas do cache mock (baseadas no redis in-memory) */
export type CacheStats = { size: number };

export function cacheStats(): CacheStats {
  // fallback: o mock não expõe size publicamente → manter contador local opcional
  // Como alternativa, exponha uma função redisSize() no mock/redis.ts
  try {
    // @ts-ignore - se o mock expuser _size(), usamos; caso contrário devolvemos -1
    const size = typeof (redis as any)._size === 'function' ? (redis as any)._size() : -1;
    return { size };
  } catch {
    return { size: -1 };
  }
}
