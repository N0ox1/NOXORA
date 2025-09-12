export async function readJson<T = unknown>(req: Request): Promise<T | undefined> {
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return undefined;
    try {
        return await req.json();
    } catch {
        return undefined;
    }
}
