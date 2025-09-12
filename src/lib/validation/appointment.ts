import { z } from 'zod';

export const ApptStatusDb = z.enum(['PENDING','CONFIRMED','CANCELED','DONE']);
export type ApptStatusDb = z.infer<typeof ApptStatusDb>;

const synonyms: Record<string, ApptStatusDb> = {
  'pending':'PENDING', 'confirm':'CONFIRMED', 'confirmed':'CONFIRMED',
  'cancelled':'CANCELED', 'canceled':'CANCELED', 'cancel':'CANCELED',
  'done':'DONE', 'finished':'DONE', 'completed':'DONE'
};

export function normalizeStatus(input: unknown): ApptStatusDb | null {
  if (typeof input !== 'string') return null;
  const key = input.trim().toLowerCase();
  return (synonyms[key] ?? (ApptStatusDb.safeParse(input).success ? (input as ApptStatusDb) : null)) ?? null;
}

export const AppointmentUpdateSchema = z.object({
  status: z.string().optional(), // normalizamos manualmente
  notes: z.string().max(500).nullable().optional()
});
