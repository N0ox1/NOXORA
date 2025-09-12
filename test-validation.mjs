#!/usr/bin/env node

import { z } from 'zod';

// Replicar o safeString do schema
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

console.log('🧪 Testando validação employeeUpdate...');

// Teste 1: Dados válidos
const testData1 = { name: "Test Employee" };
console.log('Teste 1 - Dados válidos:');
const result1 = employeeUpdate.safeParse(testData1);
console.log('Resultado:', result1);

// Teste 2: Dados inválidos
const testData2 = { name: "<script>alert(1)</script>" };
console.log('\nTeste 2 - Dados inválidos:');
const result2 = employeeUpdate.safeParse(testData2);
console.log('Resultado:', result2);

// Teste 3: Dados vazios
const testData3 = {};
console.log('\nTeste 3 - Dados vazios:');
const result3 = employeeUpdate.safeParse(testData3);
console.log('Resultado:', result3);
