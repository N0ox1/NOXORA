import { NotificationTemplateType } from '../notifications/types';

// Lista de templates permitidos na outbox
export const ALLOWED_TEMPLATES = new Set<NotificationTemplateType>([
    'created',
    'confirmed',
    'canceled',
    'reminder_24h'
]);

// Função para validar se template é permitido
export function isTemplateAllowed(template: string): template is NotificationTemplateType {
    return ALLOWED_TEMPLATES.has(template as NotificationTemplateType);
}

// Função para obter lista de templates permitidos
export function getAllowedTemplates(): string[] {
    return Array.from(ALLOWED_TEMPLATES);
}















