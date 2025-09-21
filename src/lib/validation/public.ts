import { z } from 'zod';

export const CreatePublicAppointmentSchema = z.object({
  barbershopId: z.string().min(1),
  employeeId: z.string().min(1),
  client: z.object({ 
    name: z.string().min(2), 
    phone: z.string().min(5), 
    email: z.string().email().optional() 
  }),
  services: z.array(z.string().min(1)).min(1),
  startAt: z.string().datetime(),
  notes: z.string().max(500).optional()
});




















