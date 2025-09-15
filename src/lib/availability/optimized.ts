import { PrismaClient } from '@prisma/client';
import { cacheService, CACHE_KEYS } from '../cache/redis';
import { readWithRetry } from '../database/pool';

// Configuração do algoritmo de disponibilidade
const AVAILABILITY_CONFIG = {
    // Janela de tempo para slots (5 minutos)
    SLOT_WINDOW_MINUTES: 5,
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
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // Obter disponibilidade com cache
    async getAvailability(
        tenantId: string,
        barbershopId: string,
        employeeId: string,
        day: string
    ): Promise<{ data: AvailabilityData; source: 'db' | 'redis' | 'memory' }> {
        const route = '/api/v1/availability';
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
            const [services, appointments, employeeHours] = await Promise.all([
                this.getServices(tenantId, barbershopId),
                this.getAppointments(tenantId, employeeId, day),
                this.getEmployeeHours(tenantId, employeeId, day),
            ]);

            // Calcular horário de funcionamento
            const workingHours = this.calculateWorkingHours(employeeHours, day);

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
                return this.prisma.service.findMany({
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
            return this.prisma.appointment.findMany({
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
            return this.prisma.$queryRaw`
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

    // Calcular horário de funcionamento
    private calculateWorkingHours(
        employeeHours: Array<{ start_time: string; end_time: string; break_min: number }>,
        day: string
    ): { start: Date; end: Date; breakMinutes: number } {
        if (employeeHours.length > 0) {
            const hours = employeeHours[0];
            const start = new Date(`${day}T${hours.start_time}`);
            const end = new Date(`${day}T${hours.end_time}`);
            return {
                start,
                end,
                breakMinutes: hours.break_min,
            };
        }

        // Horário padrão (8h às 18h)
        const start = new Date(`${day}T08:00:00`);
        const end = new Date(`${day}T18:00:00`);
        return {
            start,
            end,
            breakMinutes: 60, // 1 hora de almoço
        };
    }

    // Gerar slots de disponibilidade
    private generateAvailabilitySlots(
        workingHours: { start: Date; end: Date; breakMinutes: number },
        services: Array<{ id: string; durationMin: number }>,
        appointments: Array<{ startAt: Date; endAt: Date; status: string }>,
        day: string
    ): AvailabilitySlot[] {
        const slots: AvailabilitySlot[] = [];
        const slotDuration = AVAILABILITY_CONFIG.SLOT_WINDOW_MINUTES;

        // Duração mínima de serviço
        const minServiceDuration = Math.min(...services.map(s => s.durationMin));

        // Criar slots de 5 em 5 minutos
        const current = new Date(workingHours.start);
        const end = new Date(workingHours.end);

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
