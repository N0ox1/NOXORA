import { z } from 'zod';

// Safe string validation with comprehensive security checks
export const safeString = z
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

// UUID validation with null check
export const uuid = z
    .string()
    .uuid()
    .refine((v) => v !== '00000000-0000-0000-0000-000000000000', { message: 'Invalid uuid' });

// CUID validation
export const cuid = z
    .string()
    .min(1)
    .refine((v) => /^c[a-z0-9]{24}$/.test(v), { message: 'Invalid cuid' });

// Email validation
export const email = z.string().email({ message: 'Invalid email' });

// Date validation (YYYY-MM-DD format)
export const dateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date_format')
    .refine((v) => !isNaN(Date.parse(v)), { message: 'invalid_date' });

// Pagination
export const pagination = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Common headers
export const tenantHeader = z.object({
    'x-tenant-id': z.string().min(1, 'missing_tenant')
});

// Employee schemas
export const employeeCreate = z.object({
    name: safeString,
    email: email.optional(),
    phone: z.string().optional(),
    role: z.enum(['OWNER', 'MANAGER', 'BARBER', 'ASSISTANT']),
    barbershopId: cuid
});

export const employeeUpdate = z.object({
    name: safeString.optional(),
    email: email.optional(),
    phone: z.string().optional(),
    role: z.enum(['OWNER', 'MANAGER', 'BARBER', 'ASSISTANT']).optional()
});

// Service schemas
export const serviceCreate = z.object({
    name: safeString,
    description: z.string().max(500).optional(),
    duration: z.coerce.number().int().min(15).max(480), // 15min to 8h
    price: z.coerce.number().min(0).max(999999.99),
    barbershopId: uuid
});

export const serviceUpdate = z.object({
    name: safeString.optional(),
    description: z.string().max(500).optional(),
    duration: z.coerce.number().int().min(15).max(480).optional(),
    price: z.coerce.number().min(0).max(999999.99).optional()
});

// Appointment schemas
export const appointmentCreate = z.object({
    clientId: cuid,
    // Em produção, IDs podem vir de diferentes origens; não force formato aqui
    employeeId: z.string().min(1),
    serviceId: z.string().min(1),
    barbershopId: cuid,
    scheduledAt: z.string().datetime(),
    notes: z.string().max(500).optional()
});

export const appointmentUpdate = z.object({
    clientId: uuid.optional(),
    employeeId: uuid.optional(),
    serviceId: uuid.optional(),
    scheduledAt: z.string().datetime().optional(),
    notes: z.string().max(500).optional()
});

// Reporting schemas
export const reportingQuery = z.object({
    day: dateString.optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    ...pagination.shape
});

// Availability schemas
export const availabilityQuery = z.object({
    date: dateString,
    employeeId: uuid.optional(),
    serviceId: uuid.optional()
});

// Webhook schemas
export const stripeWebhook = z.object({
    id: z.string(),
    type: z.string(),
    data: z.object({
        object: z.any()
    }),
    created: z.number()
});

// Common params
export const idParam = z.object({
    id: cuid
});
