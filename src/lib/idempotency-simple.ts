import type { NextRequest } from 'next/server';

export type IdemRecord = { status: number; body: any };
const mem = new Map<string, IdemRecord>();
const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let RedisImpl: any = null;
if (hasUpstash) {
    try {
        const { Redis } = require('@upstash/redis');
        RedisImpl = Redis.fromEnv();
    } catch {
        /* fallback mem */
    }
}

const k = (tenantId: string, path: string, key: string) => `idem:${tenantId}:${path}:${key}`;

export async function idemGet(tenantId: string, path: string, key: string) {
    const keyFull = k(tenantId, path, key);
    if (RedisImpl) {
        try {
            const v = await RedisImpl.get(keyFull);
            return (v as IdemRecord | null) ?? null;
        } catch {
            /* mem */
        }
    }
    return mem.get(keyFull) || null;
}

export async function idemPut(tenantId: string, path: string, key: string, rec: IdemRecord, ttlMs = 86400000) {
    const keyFull = k(tenantId, path, key);
    if (RedisImpl) {
        try {
            await RedisImpl.set(keyFull, rec, { px: ttlMs, nx: true });
            return;
        } catch {
            /* mem */
        }
    }
    if (!mem.has(keyFull)) mem.set(keyFull, rec);
}
