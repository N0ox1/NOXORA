import { ZodSchema } from 'zod';
import { readJson } from './body';

export async function validateBody<T>(req: Request, schema: ZodSchema<T>) {
    const data = await readJson<T>(req).catch(() => undefined);
    return schema.safeParseAsync(data);
}

export async function validatedBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
    const data = await readJson<T>(req).catch(() => undefined);
    const parsed = await schema.safeParseAsync(data);
    if (!parsed.success) throw parsed.error;
    return parsed.data;
}
