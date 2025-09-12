import { NextRequest, NextResponse } from 'next/server';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Helper mínimo para padronizar export de handlers por método.
 * Uso: export const { POST, GET } = api({ POST: handlerPost, GET: handlerGet })
 */
export function api(handlers: Partial<Record<Method, RouteHandler>>) {
    return {
        GET: handlers.GET,
        POST: handlers.POST,
        PUT: handlers.PUT,
        PATCH: handlers.PATCH,
        DELETE: handlers.DELETE,
    } as Partial<Record<Method, RouteHandler>>;
}

export const json = NextResponse.json;

