#!/usr/bin/env node

import { z } from 'zod';

// Replicar o idParam do schema
const idParam = z.object({
    id: z.string().uuid()
});

console.log('🧪 Testando validação de parâmetros...');

// Teste com UUID válido
const validParams = { id: '123e4567-e89b-12d3-a456-426614174000' };
const result1 = idParam.safeParse(validParams);
console.log('UUID válido:', result1);

// Teste com UUID inválido
const invalidParams = { id: 'not-a-uuid' };
const result2 = idParam.safeParse(invalidParams);
console.log('UUID inválido:', result2);

// Teste com dados vazios
const emptyParams = {};
const result3 = idParam.safeParse(emptyParams);
console.log('Dados vazios:', result3);
