import { TemplateData, TemplateRenderResult, NotificationTemplateType } from './types';

// Templates de notificação
export const templates: Record<NotificationTemplateType, (data: TemplateData) => TemplateRenderResult> = {
    created: (data) => ({
        subject: 'Agendamento Confirmado',
        text: `Olá ${data.clientName ?? 'Cliente'}, seu agendamento para ${data.serviceName ?? 'serviço'} foi confirmado para ${data.startAt ?? 'data não informada'}.`,
        html: `<p>Olá <strong>${data.clientName ?? 'Cliente'}</strong>, seu agendamento para <strong>${data.serviceName ?? 'serviço'}</strong> foi confirmado para <strong>${data.startAt ?? 'data não informada'}</strong>.</p>`
    }),

    confirmed: (data) => ({
        subject: 'Agendamento Confirmado',
        text: `Seu agendamento para ${data.serviceName ?? 'serviço'} foi confirmado para ${data.startAt ?? 'data não informada'}.`,
        html: `<p>Seu agendamento para <strong>${data.serviceName ?? 'serviço'}</strong> foi confirmado para <strong>${data.startAt ?? 'data não informada'}</strong>.</p>`
    }),

    canceled: (data) => ({
        subject: 'Agendamento Cancelado',
        text: `Seu agendamento para ${data.serviceName ?? 'serviço'} em ${data.startAt ?? 'data não informada'} foi cancelado.`,
        html: `<p>Seu agendamento para <strong>${data.serviceName ?? 'serviço'}</strong> em <strong>${data.startAt ?? 'data não informada'}</strong> foi cancelado.</p>`
    }),

    reminder_24h: (data) => ({
        subject: 'Lembrete: seu horário é amanhã',
        text: `Olá ${data.clientName ?? 'Cliente'}, lembrete do serviço ${data.serviceName ?? 'serviço'} em ${data.startAt ?? 'data não informada'}.`,
        html: `<p>Olá <strong>${data.clientName ?? 'Cliente'}</strong>, lembrete do serviço <strong>${data.serviceName ?? 'serviço'}</strong> em <strong>${data.startAt ?? 'data não informada'}</strong>.</p>`
    })
};

// Função para renderizar template
export function renderTemplate(template: NotificationTemplateType, data: TemplateData): TemplateRenderResult {
    const renderer = templates[template];
    if (!renderer) {
        throw new Error(`Template '${template}' not found`);
    }
    return renderer(data);
}

// Função para validar dados do template
export function validateTemplateData(template: NotificationTemplateType, data: TemplateData): boolean {
    try {
        renderTemplate(template, data);
        return true;
    } catch {
        return false;
    }
}




