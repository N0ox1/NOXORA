#!/usr/bin/env node

import { z } from 'zod';

// Replicar exatamente o uuid schema
const uuid = z
    .string()
    .uuid()
    .refine((v) => v !== '00000000-0000-0000-0000-000000000000', { message: 'Invalid uuid' });

const idParam = z.object({
    id: uuid
});

console.log('🧪 Testando validação UUID...');

// Teste 1: UUID válido
const testData1 = { id: '123e4567-e89b-12d3-a456-426614174000' };
console.log('\n1️⃣ UUID válido:');
const result1 = idParam.safeParse(testData1);
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

// Teste 2: UUID inválido
const testData2 = { id: 'not-a-uuid' };
console.log('\n2️⃣ UUID inválido:');
const result2 = idParam.safeParse(testData2);
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

// Teste 3: UUID zero
const testData3 = { id: '00000000-0000-0000-0000-000000000000' };
console.log('\n3️⃣ UUID zero:');
const result3 = idParam.safeParse(testData3);
console.log('Success:', result3.success);
if (result3.success) {
    console.log('Data:', result3.data);
} else {
    console.log('Error type:', typeof result3.error);
    console.log('Error constructor:', result3.error.constructor.name);
    try {
        const flattened = result3.error.flatten();
        console.log('Flattened:', JSON.stringify(flattened, null, 2));
        console.log('Flattened type:', typeof flattened);
    } catch (e) {
        console.error('Erro ao fazer flatten:', e.message);
    }
}
