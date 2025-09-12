import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';

export type AppResponse = { statusCode: number; responseJson: any };
export type IdemResult<T = unknown> = { hit: boolean; value?: T };
export type IdemExec<T> = () => Promise<T>;
export type IdemRecord = { status: number; body: any; reqHash: string; method: string };

let r: Redis | null = null;
const hasRedis = () => !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
function redis() {
	if (r) return r;
	const url = process.env.UPSTASH_REDIS_REST_URL as string | undefined;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN as string | undefined;
	if (!url || !token) throw new Error('redis_not_configured');
	r = new Redis({ url, token });
	return r;
}

const mem = new Map<string, { v: unknown; exp: number }>();
const key3 = (tenantId: string, route: string, key: string) => `idem:${tenantId}:${route}:${key}`;
const keyHttp = (tenantId: string, route: string) => `idem:${tenantId}:${route}:__http__default`;
const now = () => Date.now();
const ttlMs = (sec: number) => sec * 1000;

export const hashPayload = (obj: unknown) => createHash('sha256').update(typeof obj === 'string' ? obj : JSON.stringify(obj ?? null)).digest('hex');

// --- Compat: idemGet (2 args -> HTTP shape | null) / (3 args -> IdemResult<T>) ---
export async function idemGet(tenantId: string, route: string): Promise<AppResponse | null>;
export async function idemGet<T>(tenantId: string, route: string, key: string): Promise<IdemResult<T>>;
export async function idemGet<T>(tenantId: string, route: string, key?: string): Promise<AppResponse | IdemResult<T> | null> {
	if (typeof key === 'undefined') {
		const id = keyHttp(tenantId, route);
		if (hasRedis()) {
			const v = await redis().get<AppResponse>(id);
			return v ?? null;
		}
		const rec = mem.get(id);
		if (!rec || now() > rec.exp) { mem.delete(id); return null; }
		return rec.v as AppResponse;
	} else {
		const id = key3(tenantId, route, key);
		if (hasRedis()) {
			const v = await redis().get<T>(id);
			return v ? { hit: true, value: v } : { hit: false };
		}
		const rec = mem.get(id);
		if (!rec || now() > rec.exp) { mem.delete(id); return { hit: false }; }
		return { hit: true, value: rec.v as T };
	}
}

// --- Compat: idemSet (3 args genérico) ---
export async function idemSet<T>(tenantId: string, route: string, key: string, value: T, ttlSec = 86400) {
	const id = key3(tenantId, route, key);
	if (hasRedis()) { await redis().set(id, value, { ex: ttlSec, nx: true }); return; }
	if (!mem.has(id)) mem.set(id, { v: value, exp: now() + ttlMs(ttlSec) });
}
// --- Compat: idemStore (HTTP response) com duas formas de chamada ---
// 1) idemStore(tenantId, route, statusCode, responseJson, ttlSec?)
// 2) idemStore<T>(tenantId, route, key, value, ttlSec?) -> alias para idemSet
export async function idemStore(tenantId: string, route: string, a: number | string, b: any, ttlSec = 86400) {
	if (typeof a === 'string') {
		// alias para genérico
		return idemSet(tenantId, route, a, b, ttlSec);
	}
	const statusCode = a as number;
	const responseJson = b;
	const id = keyHttp(tenantId, route);
	const payload: AppResponse = { statusCode, responseJson };
	if (hasRedis()) { await redis().set(id, payload, { ex: ttlSec }); return; }
	mem.set(id, { v: payload, exp: now() + ttlMs(ttlSec) });
}

// --- Conveniência: idemGetOrCreate ---
export async function idemGetOrCreate<T>(tenantId: string, route: string, key: string, exec: IdemExec<T>, ttlSec = 86400): Promise<{ res: T; fromCache: boolean }> {
	const cached = await idemGet<T>(tenantId, route, key);
	if ((cached as IdemResult<T>).hit) return { res: (cached as IdemResult<T>).value as T, fromCache: true };
	const res = await exec();
	await idemSet(tenantId, route, key, res, ttlSec);
	return { res, fromCache: false };
}

// --- Funções para verificação de conflito de payload ---
function sortDeep(v: any): any {
	if (Array.isArray(v)) return v.map(sortDeep);
	if (v && typeof v === 'object') {
		return Object.keys(v).sort().reduce((acc: any, key) => { acc[key] = sortDeep(v[key]); return acc; }, {});
	}
	return v;
}

export function hashPayloadStrict(payload: any): string {
	const s = JSON.stringify(sortDeep(payload ?? {}));
	return createHash('sha256').update(s).digest('hex');
}

// Função específica para verificação de conflito
export async function idemGetWithConflict(tenantId: string, path: string, key: string): Promise<IdemRecord | null> {
	const id = key3(tenantId, path, key);
	if (hasRedis()) {
		try {
			const v = await redis().get<IdemRecord>(id);
			return v ?? null;
		} catch {
			// fallback to mem
		}
	}
	const rec = mem.get(id);
	if (!rec || now() > rec.exp) { mem.delete(id); return null; }
	return rec.v as IdemRecord;
}

export async function idemPutWithConflict(tenantId: string, path: string, key: string, rec: IdemRecord): Promise<void> {
	const id = key3(tenantId, path, key);
	if (hasRedis()) {
		try {
			await redis().set(id, rec, { ex: 86400, nx: true });
			return;
		} catch {
			// fallback to mem
		}
	}
	if (!mem.has(id)) mem.set(id, { v: rec, exp: now() + ttlMs(86400) });
}

