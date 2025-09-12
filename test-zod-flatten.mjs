#!/usr/bin/env node

import { z } from 'zod';

const safeString = z
    .string()
    .min(1)
    .max(100)
    .refine((v) => !/[<>]/.test(v), { message: 'unsafe_chars' })
    .refine((v) => !/javascript:/i.test(v), { message: 'unsafe_chars' })
    .refine((v) => !/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/i.test(v), { message: 'unsafe_chars' })
    .refine((v) => !/'/.test(v), { message: 'unsafe_chars' })
    .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), { message: 'control_chars' })
    .refine((v) => !/[\u200B-\u200D\uFEFF]/.test(v), { message: 'control_chars' })
    .transform((v) => v.replace(/\s+/g, ' ').trim());

const employeeUpdate = z.object({
    name: safeString.optional(),
    email: z.string().email({ message: 'Invalid email' }).optional(),
    role: z.enum(['OWNER', 'MANAGER', 'BARBER', 'ASSISTANT']).optional()
});

console.log('🧪 Testando ZodError.flatten()...');

// Teste com dados inválidos
const testData = { name: "<script>alert(1)</script>" };
const result = employeeUpdate.safeParse(testData);

if (!result.success) {
    console.log('Erro encontrado, testando flatten()...');
    console.log('Tipo do error:', typeof result.error);
    console.log('É ZodError?', result.error.constructor.name);

    try {
        const flattened = result.error.flatten();
        console.log('Flatten result:', JSON.stringify(flattened, null, 2));
        console.log('Tipo do flattened:', typeof flattened);
        console.log('É Promise?', flattened instanceof Promise);
    } catch (e) {
        console.error('Erro ao fazer flatten:', e.message);
    }
} else {
    console.log('Dados válidos, não deveria chegar aqui');
}
