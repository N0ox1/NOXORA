import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
	DATABASE_URL: z.string().min(10),
	JWT_SECRET: z.string().min(32)
});
let cache: z.infer<typeof schema> | null = null;
export const env = () => (cache ??= schema.parse(process.env));
export const getEnv = env;
