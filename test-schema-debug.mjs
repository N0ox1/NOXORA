import { z } from 'zod';

// Replicate the safeString schema
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

// Test with valid data
console.log('Testing with valid data:');
const result1 = employeeUpdate.safeParse({ name: 'Test Name' });
console.log('Result:', result1);

// Test with invalid data
console.log('\nTesting with invalid data:');
const result2 = employeeUpdate.safeParse({ name: '<script>alert("xss")</script>' });
console.log('Result:', result2);

// Test with promise (this should fail)
console.log('\nTesting with promise (this should show the error):');
const promise = Promise.resolve({ name: 'Test Name' });
const result3 = employeeUpdate.safeParse(promise);
console.log('Result:', result3);
if (!result3.success) {
    console.log('Error details:', result3.error.flatten());
}
