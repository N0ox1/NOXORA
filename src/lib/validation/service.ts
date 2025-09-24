import { z } from 'zod';

export const ServiceCreateSchema = z.object({
  barbershopId: z.string().min(1),
  name: z.string().min(2),
  durationMin: z.number().int().min(5).max(600),
  priceCents: z.number().int().min(0),
  isActive: z.boolean().optional().default(true)
});

export const ServiceUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  durationMin: z.number().int().min(5).max(600).optional(),
  priceCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

























