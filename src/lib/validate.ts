import { ZodTypeAny, ZodError } from 'zod';
import { HttpError } from './http-error';

async function parseBody(req: Request) {
    try {
        const cloned = req.clone();
        const raw = await cloned.text();
        if (!raw || !raw.trim()) throw HttpError.badRequest('invalid_json');
        try { 
            const parsed = JSON.parse(raw);
            return parsed;
        } catch { throw HttpError.badRequest('invalid_json'); }
    } catch (e) {
        if (e instanceof HttpError) throw e;
        throw HttpError.badRequest('invalid_json');
    }
}

export async function validate<T extends ZodTypeAny>(req: Request, schema: T) {
    const body = await parseBody(req);
    const r = schema.safeParse(body);
    if (!r.success) {
        const e = (r.error as ZodError).flatten();
        throw HttpError.unprocessable(e);
    }
    return r.data;
}