import { z } from 'zod';

const PhoneRegex = /^\+?[1-9]\d{1,14}$/;

export const AppointmentDTO = z.object({
  barbershopId: z.string().min(1),
  serviceId: z.string().min(1),
  employeeId: z.string().min(1),
  client: z.object({
    name: z.string().min(1),
    phone: z.string().regex(PhoneRegex, 'telefone invalido'),
    email: z.string().email().optional().nullable(),
    notes: z.string().optional().nullable()
  }),
  startAt: z.string().datetime(), // ISO-8601 UTC
  endAt: z.string().datetime()    // ISO-8601 UTC
}).refine((v) => new Date(v.endAt).getTime() > new Date(v.startAt).getTime(), {
  message: 'endAt deve ser maior que startAt',
  path: ['endAt']
});

export type AppointmentDTO = z.infer<typeof AppointmentDTO>;

export const AppointmentResponse201 = z.object({
  appointmentId: z.string(),
  status: z.literal('CONFIRMED')
});
export type AppointmentResponse201 = z.infer<typeof AppointmentResponse201>;

export const Overlap409 = z.object({
  code: z.literal('OVERLAP'),
  message: z.string()
});
export type Overlap409 = z.infer<typeof Overlap409>;

export const Invalid422 = z.object({
  code: z.literal('INVALID'),
  issues: z.any()
});
export type Invalid422 = z.infer<typeof Invalid422>;
