// Cache em memória como fallback quando Redis não está disponível
interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
}

class MemoryCache {
    private cache = new Map<string, CacheEntry>();
    private stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
    };

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Verificar se expirou
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl * 1000) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.data;
    }

    async set<T>(key: string, data: T, ttl: number): Promise<void> {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
        this.stats.sets++;
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
        this.stats.deletes++;
    }

    async invalidate(pattern: string): Promise<void> {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));

        for (const key of keysToDelete) {
            this.cache.delete(key);
            this.stats.deletes++;
        }
    }

    async invalidateMultiple(patterns: string[]): Promise<void> {
        await Promise.all(patterns.map(pattern => this.invalidate(pattern)));
    }

    async getWithLock<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        // Para cache em memória, não precisamos de lock
        const cached = await this.get<T>(key);
        if (cached) {
            return cached;
        }

        const data = await fetcher();
        await this.set(key, data, 300); // TTL padrão
        return data;
    }

    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            hitRatio: total > 0 ? this.stats.hits / total : 0,
            totalKeys: this.cache.size,
            memoryUsage: 'in-memory',
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            deletes: this.stats.deletes,
        };
    }

    async close(): Promise<void> {
        this.cache.clear();
    }
}

export const memoryCache = new MemoryCache();

















