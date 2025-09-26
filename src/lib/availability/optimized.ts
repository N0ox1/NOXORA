import { prisma } from '@/lib/prisma';
import { cacheService, CACHE_KEYS } from '@/lib/cache/redis';
import { readWithRetry } from '@/lib/database/pool';

// Configuração do algoritmo de disponibilidade
const AVAILABILITY_CONFIG = {
    // Janela de tempo para slots (30 minutos)
    SLOT_WINDOW_MINUTES: 30,
    // Horário de funcionamento padrão
    DEFAULT_START_HOUR: 8,
    DEFAULT_END_HOUR: 18,
    // Duração mínima de slot
    MIN_SLOT_DURATION_MINUTES: 15,
    // Cache TTL (60 segundos)
    CACHE_TTL_SECONDS: 60,
} as const;

// Interface para slot de disponibilidade
export interface AvailabilitySlot {
    start: string; // ISO string
    end: string;   // ISO string
    duration: number; // minutos
    available: boolean;
}

// Interface para dados de disponibilidade
export interface AvailabilityData {
    tenantId: string;
    barbershopId: string;
    employeeId: string;
    day: string; // YYYY-MM-DD
    slots: AvailabilitySlot[];
    generatedAt: string;
}

// Classe otimizada para cálculo de disponibilidade
export class OptimizedAvailabilityService {

    // Obter disponibilidade com cache
    async getAvailability(
        tenantId: string,
        barbershopId: string,
        employeeId: string,
        day: string
    ): Promise<{ data: AvailabilityData; source: 'db' | 'redis' | 'memory' }> {
        const route = '/api/v1/public/availability';
        const params = { tenantId, barbershopId, employeeId, day };

        // Tentar obter do cache primeiro
        const cached = await cacheService.get<AvailabilityData>(route, params);
        if (cached) {
            return { data: cached, source: 'redis' };
        }

        // Calcular disponibilidade
        const availability = await this.calculateAvailability(
            tenantId,
            barbershopId,
            employeeId,
            day
        );

        // Armazenar no cache
        await cacheService.set(route, availability, params);

        return { data: availability, source: 'db' };
    }

    // Calcular disponibilidade (algoritmo otimizado)
    private async calculateAvailability(
        tenantId: string,
        barbershopId: string,
        employeeId: string,
        day: string
    ): Promise<AvailabilityData> {
        const startTime = Date.now();

        try {
            // Obter dados necessários em paralelo
            const [services, appointments, employeeHours, barbershopHours] = await Promise.all([
                this.getServices(tenantId, barbershopId),
                employeeId ? this.getAppointments(tenantId, employeeId, day) : Promise.resolve([]),
                employeeId ? this.getEmployeeHours(tenantId, employeeId, day).catch(() => []) : Promise.resolve([]),
                this.getBarbershopHours(tenantId, barbershopId, day),
            ]);

        // Calcular horário de funcionamento
        const workingHours = this.calculateWorkingHours(employeeHours, barbershopHours, day);

        // Gerar slots de disponibilidade
            const slots = this.generateAvailabilitySlots(
                workingHours,
                services,
                appointments,
                day
            );

            const duration = Date.now() - startTime;
            console.log(`Availability calculated in ${duration}ms for ${tenantId}/${employeeId}/${day}`);

            return {
                tenantId,
                barbershopId,
                employeeId,
                day,
                slots,
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Error calculating availability:', error);
            throw error;
        }
    }

    // Obter serviços com cache
    private async getServices(tenantId: string, barbershopId: string) {
        const cacheKey = CACHE_KEYS.servicesHot(tenantId, barbershopId);

        return cacheService.getWithLock(cacheKey, {}, async () => {
            return readWithRetry(async () => {
                return prisma.service.findMany({
                    where: {
                        tenantId,
                        barbershopId,
                        isActive: true,
                    },
                    select: {
                        id: true,
                        durationMin: true,
                        priceCents: true,
                    },
                });
            }, 'getServices');
        });
    }

    // Obter agendamentos do dia
    private async getAppointments(tenantId: string, employeeId: string, day: string) {
        const dayStart = new Date(day);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);

        return readWithRetry(async () => {
            return prisma.appointment.findMany({
                where: {
                    tenantId,
                    employeeId,
                    startAt: {
                        gte: dayStart,
                        lt: dayEnd,
                    },
                    status: {
                        in: ['CONFIRMED', 'PENDING'],
                    },
                },
                select: {
                    id: true,
                    startAt: true,
                    endAt: true,
                    status: true,
                },
                orderBy: {
                    startAt: 'asc',
                },
            });
        }, 'getAppointments');
    }

    // Obter horários do funcionário
    private async getEmployeeHours(tenantId: string, employeeId: string, day: string) {
        const dayOfWeek = new Date(day).getDay();

        return readWithRetry(async () => {
            return prisma.$queryRaw`
        SELECT start_time, end_time, break_min
        FROM employees_hours
        WHERE employee_id = ${employeeId}
        AND weekday = ${dayOfWeek}
      ` as unknown as Array<{
                start_time: string;
                end_time: string;
                break_min: number;
            }>;
        }, 'getEmployeeHours');
    }

    // Obter horários da barbearia com cache
    private async getBarbershopHours(tenantId: string, barbershopId: string, day: string) {
        const barbershop = await cacheService.getWithLock(
            CACHE_KEYS.publicShop(tenantId, barbershopId),
            {},
            async () => {
                return readWithRetry(async () => {
                    return prisma.barbershop.findUnique({
                        where: { id: barbershopId },
                        select: { workingHours: true },
                    });
                }, 'getBarbershopHours');
            }
        );

        if (!barbershop) {
            return null;
        }

        const { workingHours } = barbershop as { workingHours: any };
        if (!workingHours) {
            return null;
        }

        // Normalizar diferentes formatos de workingHours armazenados
        // Formato 1 (comum): [{ weekday: 1-7|0-6, open: '09:00', close: '21:00', is_closed: false }]
        // Formato 2 (legado): [{ weekday: 0-6, open_time: '09:00', close_time: '21:00', is_closed: false }]
        try {
            const dayOfWeek = new Date(day).getDay(); // 0=Domingo
            const list = Array.isArray(workingHours) ? workingHours : [];

            // Tentar casar por 'weekday' com 0-6
            let dayHours: any = list.find((dh: any) => dh.weekday === dayOfWeek);
            // Alternativa: alguns salvam 1-7, onde 1=Domingo ou 1=Segunda. Tentar 1-7 (Domingo=1)
            if (!dayHours) {
                const altKey = ((dayOfWeek + 1) % 7) + 1; // 0->1, 1->2, ... 6->7
                dayHours = list.find((dh: any) => dh.weekday === altKey);
            }

            if (!dayHours) {
                return null;
            }

            const open = typeof dayHours.open === 'string' ? dayHours.open
                : typeof dayHours.open_time === 'string' ? dayHours.open_time
                    : null;
            const close = typeof dayHours.close === 'string' ? dayHours.close
                : typeof dayHours.close_time === 'string' ? dayHours.close_time
                    : null;
            const closed = !!dayHours.is_closed;

            if (!open || !close) {
                return null;
            }

            return { open, close, closed };
        } catch {
            return null;
        }
    }

    // Calcular horário de funcionamento
    private calculateWorkingHours(
        employeeHours: Array<{ start_time: string; end_time: string; break_min: number }> | null,
        barbershopHours: { open: string; close: string; closed: boolean } | null,
        day: string
    ): { startHour: number; endHour: number; startMinute: number; endMinute: number; startMinutes: number; endMinutes: number; isClosed: boolean } {
        const parseRange = (open: string, close: string) => {
            const [openHour, openMinute] = open.split(':').map(v => parseInt(v, 10));
            const [closeHour, closeMinute] = close.split(':').map(v => parseInt(v, 10));
            const startMinutes = openHour * 60 + openMinute;
            let endMinutes = closeHour * 60 + closeMinute;
            if (endMinutes <= startMinutes) {
                endMinutes = startMinutes + 60;
            }
            return { openHour, openMinute, closeHour, closeMinute, startMinutes, endMinutes };
        };

        if (employeeHours && employeeHours.length > 0) {
            const hours = employeeHours[0];
            const { openHour, openMinute, closeMinute, startMinutes, endMinutes } = parseRange(hours.start_time, hours.end_time);
            return {
                startHour: openHour,
                endHour: Math.ceil(endMinutes / 60),
                startMinute: openMinute,
                endMinute: closeMinute,
                startMinutes,
                endMinutes,
                isClosed: false,
            };
        }

        if (barbershopHours && !barbershopHours.closed) {
            const { openHour, openMinute, closeMinute, startMinutes, endMinutes } = parseRange(barbershopHours.open, barbershopHours.close);
            return {
                startHour: openHour,
                endHour: Math.ceil(endMinutes / 60),
                startMinute: openMinute,
                endMinute: closeMinute,
                startMinutes,
                endMinutes,
                isClosed: false,
            };
        }

        return {
            startHour: 8,
            endHour: 18,
            startMinute: 0,
            endMinute: 0,
            startMinutes: 8 * 60,
            endMinutes: 18 * 60,
            isClosed: !!barbershopHours?.closed,
        };
    }

    // Gerar slots de disponibilidade
    private generateAvailabilitySlots(
        workingHours: { startHour: number; endHour: number; startMinute: number; endMinute: number; startMinutes: number; endMinutes: number; isClosed: boolean },
        services: Array<{ id: string; durationMin: number }>,
        appointments: Array<{ startAt: Date; endAt: Date; status: string }>,
        day: string
    ): AvailabilitySlot[] {
        const slots: AvailabilitySlot[] = [];
        const slotDuration = AVAILABILITY_CONFIG.SLOT_WINDOW_MINUTES;

        // Duração mínima de serviço (fallback para duração mínima de slot se lista vazia)
        const minServiceDuration = services.length > 0
            ? Math.min(...services.map(s => s.durationMin))
            : AVAILABILITY_CONFIG.MIN_SLOT_DURATION_MINUTES;

        // Base do dia (00:00 local) e aplicar minutos de funcionamento
        const dayBase = new Date(day + 'T00:00:00');
        const current = new Date(dayBase);
        current.setMinutes(workingHours.startMinutes);
        const end = new Date(dayBase);
        end.setMinutes(workingHours.endMinutes);

        while (current < end) {
            const slotStart = new Date(current);
            const slotEnd = new Date(current.getTime() + slotDuration * 60000);

            // Verificar se o slot está dentro do horário de funcionamento
            if (slotEnd <= end) {
                // Verificar se há conflito com agendamentos existentes
                const hasConflict = appointments.some(appt => {
                    const apptStart = new Date(appt.startAt);
                    const apptEnd = new Date(appt.endAt);

                    // Verificar sobreposição
                    return slotStart < apptEnd && slotEnd > apptStart;
                });

                // Verificar se o slot é grande o suficiente para o menor serviço
                const isLongEnough = slotDuration >= minServiceDuration;

                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                    duration: slotDuration,
                    available: !hasConflict && isLongEnough,
                });
            }

            current.setMinutes(current.getMinutes() + slotDuration);
        }

        return slots;
    }

    // Invalidar cache de disponibilidade
    async invalidateAvailability(
        tenantId: string,
        barbershopId: string,
        day: string
    ): Promise<void> {
        const cacheKey = CACHE_KEYS.availability(tenantId, barbershopId, day);
        await cacheService.invalidate(cacheKey);
    }

    // Obter estatísticas de cache
    async getCacheStats() {
        return cacheService.getStats();
    }
}

// Instância singleton
export const availabilityService = new OptimizedAvailabilityService();
