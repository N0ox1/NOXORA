export type Channel = 'whatsapp' | 'email';
export type TemplateKey = 'appointment_confirmed' | 'appointment_reminder';

export const TEMPLATES: Record<TemplateKey, { channel: Channel; text: string; subject?: string }> = {
  appointment_confirmed: { channel: 'whatsapp', text: 'Seu horário {{service}} em {{date}} foi confirmado.' },
  appointment_reminder:  { channel: 'whatsapp', text: 'Lembrete: {{service}} às {{time}} na {{shop}}.' }
};

export function render(template: string, data: Record<string, string | number>): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, k) => String(data[k.trim()] ?? ''));
}
