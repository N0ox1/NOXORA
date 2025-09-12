import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

export function middleware(req: Request) {
    const headers = new Headers(req.headers);
    if (!headers.get('x-request-id')) {
        headers.set('x-request-id', uuid());
    }

    // Bypass rate limiting for test endpoints
    const bypass = process.env.RL_BYPASS_PATHS?.split(',') ?? [];
    const url = new URL(req.url);
    if (bypass.some(p => url.pathname.startsWith(p))) {
        const res = NextResponse.next({ request: { headers } });
        res.headers.set('x-request-id', headers.get('x-request-id')!);
        return res;
    }

    const res = NextResponse.next({ request: { headers } });
    res.headers.set('x-request-id', headers.get('x-request-id')!);

    return res;
}

export const config = {
    matcher: ['/api/:path*']
};
