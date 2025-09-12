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

// Simular readJson
async function readJson(req) {
    try {
        return await req.json();
    } catch {
        return undefined;
    }
}

// Simular o que acontece no endpoint
async function testValidation() {
    console.log('🧪 Testando validação isolada...');

    // Mock request
    const mockReq = {
        json: async () => ({ name: 'Novo Nome' })
    };

    try {
        console.log('1️⃣ Chamando readJson...');
        const body = await readJson(mockReq);
        console.log('Body recebido:', body);
        console.log('Tipo do body:', typeof body);
        console.log('Body é Promise:', body instanceof Promise);

        console.log('2️⃣ Validando com employeeUpdate.safeParse...');
        const parsed = employeeUpdate.safeParse(body);
        console.log('Resultado:', parsed.success ? '✅ Sucesso' : '❌ Erro');
        if (!parsed.success) {
            console.log('Erro detalhado:', parsed.error.flatten());
        } else {
            console.log('Dados validados:', parsed.data);
        }

    } catch (error) {
        console.error('Erro durante teste:', error);
    }
}

testValidation();
