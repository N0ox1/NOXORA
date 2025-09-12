export function withPgBouncer(raw: string): string {
	try {
		const u = new URL(raw);
		const set = (k: string, v: string) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); };
		set('sslmode', 'require');
		set('pgbouncer', 'true');
		set('connection_limit', '1');
		set('pool_timeout', '60');
		set('connect_timeout', '10');
		return u.toString();
	} catch {
		return raw;
	}
}



