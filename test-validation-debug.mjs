#!/usr/bin/env node

import { z } from 'zod';

// Replicar exatamente o schema employeeUpdate com safeString
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
    email: z.string().email().optional(),
    role: z.enum(['OWNER', 'MANAGER', 'BARBER', 'ASSISTANT']).optional()
});

console.log('🧪 Testando validação employeeUpdate...');

// Teste 1: Dados válidos
const testData1 = { name: "Test Employee" };
console.log('\n1️⃣ Dados válidos:');
const result1 = employeeUpdate.safeParse(testData1);
console.log('Success:', result1.success);
if (result1.success) {
    console.log('Data:', result1.data);
} else {
    console.log('Error type:', typeof result1.error);
    console.log('Error constructor:', result1.error.constructor.name);
    try {
        const flattened = result1.error.flatten();
        console.log('Flattened:', JSON.stringify(flattened, null, 2));
        console.log('Flattened type:', typeof flattened);
    } catch (e) {
        console.error('Erro ao fazer flatten:', e.message);
    }
}

// Teste 2: Dados inválidos
const testData2 = { name: "<script>alert(1)</script>" };
console.log('\n2️⃣ Dados inválidos:');
const result2 = employeeUpdate.safeParse(testData2);
console.log('Success:', result2.success);
if (result2.success) {
    console.log('Data:', result2.data);
} else {
    console.log('Error type:', typeof result2.error);
    console.log('Error constructor:', result2.error.constructor.name);
    try {
        const flattened = result2.error.flatten();
        console.log('Flattened:', JSON.stringify(flattened, null, 2));
        console.log('Flattened type:', typeof flattened);
    } catch (e) {
        console.error('Erro ao fazer flatten:', e.message);
    }
}
