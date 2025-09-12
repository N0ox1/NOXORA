import { TEMPLATES, render, type TemplateKey } from '@/lib/notifications/templates';

export type NotificationJob = {
  id: string;
  tenantId: string;
  type: 'send_confirmation' | 'send_reminder';
  template: TemplateKey;
  payload: Record<string, any>;
};

// Garantir singleton no dev/route reload
const g = globalThis as any;
if (!g.__NOX_QUEUE__) g.__NOX_QUEUE__ = [] as NotificationJob[];
const q: NotificationJob[] = g.__NOX_QUEUE__;

export function enqueue(job: NotificationJob) { q.push(job); }
export function size() { return q.length; }
export function drain(max = Infinity): NotificationJob[] { const take = Math.min(q.length, max); return q.splice(0, take); }
export function processJobs(max = 50) {
  const jobs = drain(max);
  const results = jobs.map(j => {
    const tpl = TEMPLATES[j.template];
    const message = render(tpl.text, j.payload || {});
    return { id: j.id, tenantId: j.tenantId, channel: tpl.channel, message };
  });
  return { processed: results.length, results };
}
export function enqueueReminder(tenantId: string, payload: Record<string, any>) { enqueue({ id: `job_${Date.now()}`, tenantId, type: 'send_reminder', template: 'appointment_reminder', payload }); }
export function enqueueConfirmation(tenantId: string, payload: Record<string, any>) { enqueue({ id: `job_${Date.now()}`, tenantId, type: 'send_confirmation', template: 'appointment_confirmed', payload }); }
