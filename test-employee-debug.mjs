import { z } from 'zod';

// Replicar exatamente o schema employeeUpdate
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

// Simular o que acontece no endpoint
console.log('🧪 Testando validação do employeeUpdate...');

// Teste 1: Dados válidos
console.log('\n1️⃣ Teste com dados válidos:');
const validData = { name: 'Novo Nome' };
const result1 = employeeUpdate.safeParse(validData);
console.log('Resultado:', result1.success ? '✅ Sucesso' : '❌ Erro');
if (!result1.success) {
    console.log('Erro:', result1.error.flatten());
}

// Teste 2: Dados inválidos
console.log('\n2️⃣ Teste com dados inválidos:');
const invalidData = { name: '<script>alert("xss")</script>' };
const result2 = employeeUpdate.safeParse(invalidData);
console.log('Resultado:', result2.success ? '✅ Sucesso' : '❌ Erro');
if (!result2.success) {
    console.log('Erro:', result2.error.flatten());
}

// Teste 3: Simular o que pode estar acontecendo
console.log('\n3️⃣ Teste simulando problema:');
const promiseData = Promise.resolve({ name: 'Novo Nome' });
const result3 = employeeUpdate.safeParse(promiseData);
console.log('Resultado:', result3.success ? '✅ Sucesso' : '❌ Erro');
if (!result3.success) {
    console.log('Erro:', result3.error.flatten());
}

// Teste 4: Verificar se o problema está no safeString
console.log('\n4️⃣ Teste do safeString isoladamente:');
const safeStringResult = safeString.safeParse('Novo Nome');
console.log('safeString resultado:', safeStringResult.success ? '✅ Sucesso' : '❌ Erro');
if (!safeStringResult.success) {
    console.log('safeString erro:', safeStringResult.error.flatten());
}
