import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export function validateContentType(req: NextRequest) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const contentType = req.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json(
                { code: 'unsupported_media_type', msg: 'Content-Type must be application/json' },
                { status: 415 }
            );
        }
    }
    return null;
}

export function validateTenantHeader(req: NextRequest) {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
        return NextResponse.json(
            { code: 'bad_request', msg: 'missing_tenant' },
            { status: 400 }
        );
    }
    return null;
}

export function validateHeaders(req: NextRequest) {
    const contentTypeError = validateContentType(req);
    if (contentTypeError) return contentTypeError;

    const tenantError = validateTenantHeader(req);
    if (tenantError) return tenantError;

    return null;
}

export function validateQuery<T>(schema: ZodSchema<T>) {
    return (req: NextRequest) => {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams.entries());

        const result = schema.safeParse(query);
        if (!result.success) {
            return NextResponse.json(
                { code: 'validation_error', errors: result.error.flatten() },
                { status: 422 }
            );
        }

        return { data: result.data };
    };
}

export function validateParams<T>(schema: ZodSchema<T>) {
    return (req: NextRequest, params: any) => {
        const result = schema.safeParse(params);
        if (!result.success) {
            return NextResponse.json(
                { code: 'validation_error', errors: result.error.flatten() },
                { status: 422 }
            );
        }

        return { data: result.data };
    };
}












