import { z } from 'zod';

// Enum de templates com validação Zod
export const NotificationTemplate = z.enum(['created', 'confirmed', 'canceled', 'reminder_24h']);

// Schema para validação de requisição
export const NotificationRequestSchema = z.object({
    template: NotificationTemplate,
    to: z.string().email(),
    data: z.record(z.any()).optional(),
    forceFail: z.boolean().optional()
});

// Schema para validação de headers
export const NotificationHeadersSchema = z.object({
    'x-tenant-id': z.string().min(1),
    'idempotency-key': z.string().optional()
});

// Tipos TypeScript derivados
export type NotificationTemplateType = z.infer<typeof NotificationTemplate>;
export type NotificationRequest = z.infer<typeof NotificationRequestSchema>;
export type NotificationHeaders = z.infer<typeof NotificationHeadersSchema>;

// Template data interface
export interface TemplateData {
    clientName?: string;
    serviceName?: string;
    startAt?: string;
    [key: string]: any;
}

// Template render result
export interface TemplateRenderResult {
    subject: string;
    text: string;
    html?: string;
}




