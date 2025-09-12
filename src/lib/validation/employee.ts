import { z } from 'zod';

export const EmployeeRoleSchema = z.enum(['OWNER','MANAGER','BARBER','ASSISTANT']);

export const EmployeeCreateSchema = z.object({
  barbershopId: z.string().min(1),
  name: z.string().min(2),
  role: EmployeeRoleSchema,
  active: z.boolean().optional().default(true)
});

export const EmployeeUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: EmployeeRoleSchema.optional(),
  active: z.boolean().optional()
});
