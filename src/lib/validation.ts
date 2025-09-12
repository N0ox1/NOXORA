import { z } from 'zod';

export const zStr = () => z.string().transform(s => s.trim());
export const cuid = () => z.string().cuid();
export const strict = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();
export const zISODate = () => z.string().datetime();
