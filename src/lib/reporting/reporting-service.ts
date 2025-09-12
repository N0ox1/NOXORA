import { db } from '@/lib/db';
import redis from '@/lib/redis';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import {
  appointments,
  services,
  employees,
  barbershops,
  clients,
} from '@/lib/db/schema';
import {
  eq,
  and,
  gte,
  lte,
  sql,
  count,
  sum,
  desc,
  asc,
  inArray,
} from 'drizzle-orm';
import {
  type MetricConfig,
  type MetricResult,
  type Report,
  type ReportFilters,
  type PerformanceReport,
  type TrendPoint,
  type TopPerformer,
  type MetricType,
  type MetricFilter,
  calculateDateRange,
  formatMetricValue,
  calculateTrend,
} from '@/types/reporting';

export class ReportingService {
  private static instance: ReportingService;
  private metricConfigs: Map<string, MetricConfig> = new Map();

  private constructor() {
    this.initializeMetricConfigs();
  }

  public static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  /**
   * Inicializa configurações de métricas do reporting.json
   */
  private initializeMetricConfigs() {
    const configs: Record<string, MetricConfig> = {
      bookings_today: {
        type: 'count',
        source: 'appointments',
        filter: {
          status_in: ['CONFIRMED', 'DONE'],
          date: 'today',
        },
      },
      no_show_rate_7d: {
        type: 'ratio',
        source: 'appointments',
        window_days: 7,
      },
      revenue_estimate_30d: {
        type: 'sum',
        source: 'appointments',
        window_days: 30,
        filter: {
          status_in: ['CONFIRMED', 'DONE'],
        },
      },
    };

    for (const [key, config] of Object.entries(configs)) {
      this.metricConfigs.set(key, config);
    }

    logger.info('Metric configurations loaded', { count: configs.length });
  }

  /**
   * Calcula uma métrica específica
   */
  public async calculateMetric(
    metricId: string,
    tenantId: string,
    filters?: Partial<MetricFilter>
  ): Promise<MetricResult> {
    const metricConfig = this.metricConfigs.get(metricId);
    if (!metricConfig) {
      throw new Error(`Metric configuration not found: ${metricId}`);
    }

    // Verifica cache primeiro
    const cacheKey = `metric:${tenantId}:${metricId}:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let value: number;
    const metadata: any = {};

    try {
      switch (metricConfig.type) {
        case 'count':
          value = await this.calculateCountMetric(metricConfig, tenantId, filters);
          break;
        case 'ratio':
          value = await this.calculateRatioMetric(metricConfig, tenantId, filters);
          break;
        case 'sum':
          value = await this.calculateSumMetric(metricConfig, tenantId, filters);
          break;
        default:
          throw new Error(`Unsupported metric type: ${metricConfig.type}`);
      }

      // Calcula tendência se aplicável
      if (metricConfig.window_days) {
        const previousValue = await this.calculatePreviousPeriodValue(
          metricConfig,
          tenantId,
          filters,
          metricConfig.window_days
        );
        const trend = calculateTrend(value, previousValue);
        metadata.trend = trend.direction;
        metadata.trend_value = trend.value;
        metadata.percentage = trend.percentage;
      }

      const result: MetricResult = {
        metric: metricId,
        value,
        unit: this.getUnitForMetric(metricId),
        formatted_value: formatMetricValue(value, metricConfig.type, this.getUnitForMetric(metricId)),
        metadata: {
          ...metadata,
          last_updated: new Date(),
        },
      };

      // Cache do resultado
      const ttl = metricConfig.cache_ttl || 300; // 5 minutos por padrão
      await redis.setex(cacheKey, ttl, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Failed to calculate metric', { metricId, tenantId, error });
      throw error;
    }
  }

  /**
   * Calcula métrica de contagem
   */
  private async calculateCountMetric(
    config: MetricConfig,
    tenantId: string,
    filters?: Partial<MetricFilter>
  ): Promise<number> {
    const whereConditions = this.buildWhereConditions(config, tenantId, filters);
    
    const result = await db
      .select({ count: count() })
      .from(appointments)
      .where(and(...whereConditions));

    return result[0]?.count || 0;
  }

  /**
   * Calcula métrica de razão (ex: taxa de no-show)
   */
  private async calculateRatioMetric(
    config: MetricConfig,
    tenantId: string,
    filters?: Partial<MetricFilter>
  ): Promise<number> {
    if (!config.window_days) {
      throw new Error('Ratio metrics require window_days configuration');
    }

    const { start, end } = this.calculateWindowDates(config.window_days);
    const baseFilters = this.buildBaseFilters(tenantId, filters);

    // Total de agendamentos no período
    const totalResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          ...baseFilters,
          gte(appointments.startAt, start),
          lte(appointments.startAt, end)
        )
      );

    const total = totalResult[0]?.count || 0;

    if (total === 0) return 0;

    // Agendamentos com no-show (status CANCELLED ou não compareceu)
    const noShowResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          ...baseFilters,
          gte(appointments.startAt, start),
          lte(appointments.startAt, end),
          eq(appointments.status, 'CANCELED')
        )
      );

    const noShows = noShowResult[0]?.count || 0;

    return noShows / total;
  }

  /**
   * Calcula métrica de soma (ex: receita)
   */
  private async calculateSumMetric(
    config: MetricConfig,
    tenantId: string,
    filters?: Partial<MetricFilter>
  ): Promise<number> {
    const whereConditions = this.buildWhereConditions(config, tenantId, filters);
    
    // Para receita, precisamos fazer join com services para pegar o preço
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${services.priceCents}), 0)`,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(and(...whereConditions));

    return result[0]?.total || 0;
  }

  /**
   * Calcula valor do período anterior para comparação
   */
  private async calculatePreviousPeriodValue(
    config: MetricConfig,
    tenantId: string,
    filters: Partial<MetricFilter> | undefined,
    windowDays: number
  ): Promise<number> {
    const { start, end } = this.calculateWindowDates(windowDays);
    const previousStart = new Date(start.getTime() - (windowDays * 24 * 60 * 60 * 1000));
    const previousEnd = new Date(start.getTime() - 1);

    const baseFilters = this.buildBaseFilters(tenantId, filters);

    try {
      if (config.type === 'count') {
        const result = await db
          .select({ count: count() })
          .from(appointments)
          .where(
            and(
              ...baseFilters,
              gte(appointments.startAt, previousStart),
              lte(appointments.startAt, previousEnd)
            )
          );
        return result[0]?.count || 0;
      } else if (config.type === 'sum') {
        const result = await db
          .select({
            total: sql<number>`COALESCE(SUM(${services.priceCents}), 0)`,
          })
          .from(appointments)
          .innerJoin(services, eq(appointments.serviceId, services.id))
          .where(
            and(
              ...baseFilters,
              gte(appointments.startAt, previousStart),
              lte(appointments.startAt, previousEnd)
            )
          );
        return result[0]?.total || 0;
      }
    } catch (error) {
      logger.warn('Failed to calculate previous period value', { error });
    }

    return 0;
  }

  /**
   * Constrói condições WHERE para queries
   */
  private buildWhereConditions(
    config: MetricConfig,
    tenantId: string,
    filters?: Partial<MetricFilter>
  ): any[] {
    const conditions = [eq(appointments.tenantId, tenantId)];

    // Filtros da configuração da métrica
    if (config.filter) {
      conditions.push(...this.buildFilterConditions(config.filter));
    }

    // Filtros adicionais passados como parâmetro
    if (filters) {
      conditions.push(...this.buildFilterConditions(filters));
    }

    // Filtros de data se especificado
    if (config.window_days) {
      const { start, end } = this.calculateWindowDates(config.window_days);
      conditions.push(gte(appointments.startAt, start));
      conditions.push(lte(appointments.startAt, end));
    }

    return conditions;
  }

  /**
   * Constrói filtros base
   */
  private buildBaseFilters(tenantId: string, filters?: Partial<MetricFilter>): any[] {
    const conditions = [eq(appointments.tenantId, tenantId)];

    if (filters?.barbershop_id) {
      conditions.push(eq(appointments.barbershopId, filters.barbershop_id));
    }

    if (filters?.employee_id) {
      conditions.push(eq(appointments.employeeId, filters.employee_id));
    }

    if (filters?.service_id) {
      conditions.push(eq(appointments.serviceId, filters.service_id));
    }

    return conditions;
  }

  /**
   * Constrói condições de filtro
   */
  private buildFilterConditions(filter: MetricFilter): any[] {
    const conditions: any[] = [];

    if (filter.status_in && filter.status_in.length > 0) {
      conditions.push(inArray(appointments.status, filter.status_in as any));
    }

    if (filter.date) {
      const { start, end } = calculateDateRange(filter.date);
      conditions.push(gte(appointments.startAt, start));
      conditions.push(lte(appointments.startAt, end));
    }

    if (filter.start_date) {
      conditions.push(gte(appointments.startAt, new Date(filter.start_date)));
    }

    if (filter.end_date) {
      conditions.push(lte(appointments.startAt, new Date(filter.end_date)));
    }

    return conditions;
  }

  /**
   * Calcula datas de janela para métricas
   */
  private calculateWindowDates(windowDays: number): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end.getTime() - (windowDays * 24 * 60 * 60 * 1000));
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Obtém unidade para uma métrica
   */
  private getUnitForMetric(metricId: string): string | undefined {
    switch (metricId) {
      case 'revenue_estimate_30d':
        return 'price_cents';
      case 'no_show_rate_7d':
        return 'ratio';
      default:
        return undefined;
    }
  }

  /**
   * Gera relatório completo com todas as métricas
   */
  public async generateReport(
    tenantId: string,
    filters: ReportFilters
  ): Promise<Report> {
    try {
      const metrics: MetricResult[] = [];

      // Calcula todas as métricas configuradas
      for (const [metricId, config] of this.metricConfigs) {
        try {
          const metric = await this.calculateMetric(metricId, tenantId, {
            barbershop_id: filters.barbershops?.[0],
            employee_id: filters.employees?.[0],
            service_id: filters.services?.[0],
            status_in: filters.statuses,
          });
          metrics.push(metric);
        } catch (error) {
          logger.error('Failed to calculate metric for report', { metricId, error });
        }
      }

      const report: Report = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenant_id: tenantId,
        name: 'Relatório Automático',
        description: 'Relatório gerado automaticamente com métricas principais',
        metrics,
        filters,
        generated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira em 24h
      };

      logger.info('Report generated successfully', {
        reportId: report.id,
        tenantId,
        metricsCount: metrics.length,
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate report', { tenantId, error });
      throw error;
    }
  }

  /**
   * Gera relatório de performance completo
   */
  public async generatePerformanceReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport> {
    try {
      // Resumo geral
      const summary = await this.calculateSummary(tenantId, startDate, endDate);
      
      // Métricas calculadas
      const metrics = await this.calculatePerformanceMetrics(tenantId, startDate, endDate);
      
      // Tendências
      const trends = await this.calculateTrends(tenantId, startDate, endDate);
      
      // Top performers
      const topPerformers = await this.calculateTopPerformers(tenantId, startDate, endDate);

      const report: PerformanceReport = {
        tenant_id: tenantId,
        period: { start: startDate, end: endDate },
        summary,
        metrics,
        trends,
        top_performers: topPerformers,
      };

      logger.info('Performance report generated successfully', {
        tenantId,
        period: { start: startDate, end: endDate },
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate performance report', { tenantId, error });
      throw error;
    }
  }

  /**
   * Calcula resumo geral
   */
  private async calculateSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport['summary']> {
    const whereConditions = [
      eq(appointments.tenantId, tenantId),
      gte(appointments.startAt, startDate),
      lte(appointments.startAt, endDate),
    ];

    const [totalResult, confirmedResult, completedResult, cancelledResult, noShowResult] = await Promise.all([
      db.select({ count: count() }).from(appointments).where(and(...whereConditions)),
      db.select({ count: count() }).from(appointments).where(and(...whereConditions, eq(appointments.status, 'CONFIRMED'))),
      db.select({ count: count() }).from(appointments).where(and(...whereConditions, eq(appointments.status, 'DONE'))),
      db.select({ count: count() }).from(appointments).where(and(...whereConditions, eq(appointments.status, 'CANCELED'))),
      db.select({ count: count() }).from(appointments).where(and(...whereConditions, eq(appointments.status, 'NO_SHOW'))),
    ]);

    // Receita total
    const revenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${services.priceCents}), 0)`,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(and(...whereConditions, eq(appointments.status, 'DONE')));

    return {
      total_appointments: totalResult[0]?.count || 0,
      confirmed_appointments: confirmedResult[0]?.count || 0,
      completed_appointments: completedResult[0]?.count || 0,
      cancelled_appointments: cancelledResult[0]?.count || 0,
      no_shows: noShowResult[0]?.count || 0,
      total_revenue: revenueResult[0]?.total || 0,
      average_rating: 0, // TODO: Implementar quando tivermos sistema de avaliações
    };
  }

  /**
   * Calcula métricas de performance
   */
  private async calculatePerformanceMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport['metrics']> {
    const summary = await this.calculateSummary(tenantId, startDate, endDate);

    const total = summary.total_appointments;
    const confirmed = summary.confirmed_appointments;
    const completed = summary.completed_appointments;
    const noShows = summary.no_shows;
    const revenue = summary.total_revenue;

    return {
      booking_rate: total > 0 ? confirmed / total : 0,
      completion_rate: total > 0 ? completed / total : 0,
      no_show_rate: total > 0 ? noShows / total : 0,
      revenue_per_appointment: completed > 0 ? revenue / completed : 0,
      customer_satisfaction: 0, // TODO: Implementar quando tivermos sistema de avaliações
    };
  }

  /**
   * Calcula tendências
   */
  private async calculateTrends(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport['trends']> {
    // Implementação simplificada - em produção seria mais sofisticada
    const daily: TrendPoint[] = [];
    const weekly: TrendPoint[] = [];
    const monthly: TrendPoint[] = [];

    // TODO: Implementar cálculo de tendências por período

    return { daily, weekly, monthly };
  }

  /**
   * Calcula top performers
   */
  private async calculateTopPerformers(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport['top_performers']> {
    const whereConditions = [
      eq(appointments.tenantId, tenantId),
      gte(appointments.startAt, startDate),
      lte(appointments.startAt, endDate),
      eq(appointments.status, 'DONE'),
    ];

    // Top funcionários por agendamentos completados
    const topEmployees = await db
      .select({
        id: employees.id,
        name: employees.name,
        count: count(),
      })
      .from(appointments)
      .innerJoin(employees, eq(appointments.employeeId, employees.id))
      .where(and(...whereConditions))
      .groupBy(employees.id, employees.name)
      .orderBy(desc(count()))
      .limit(5);

    // Top serviços por receita
    const topServices = await db
      .select({
        id: services.id,
        name: services.name,
        revenue: sql<number>`COALESCE(SUM(${services.priceCents}), 0)`,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(and(...whereConditions))
      .groupBy(services.id, services.name)
      .orderBy(desc(sql`COALESCE(SUM(${services.priceCents}), 0)`))
      .limit(5);

    // Top barbearias por agendamentos
    const topBarbershops = await db
      .select({
        id: barbershops.id,
        name: barbershops.name,
        count: count(),
      })
      .from(appointments)
      .innerJoin(barbershops, eq(appointments.barbershopId, barbershops.id))
      .where(and(...whereConditions))
      .groupBy(barbershops.id, barbershops.name)
      .orderBy(desc(count()))
      .limit(5);

    return {
      employees: topEmployees.map((emp, index) => ({
        id: emp.id,
        name: emp.name,
        metric: 'appointments_completed',
        value: emp.count,
        rank: index + 1,
      })),
      services: topServices.map((service, index) => ({
        id: service.id,
        name: service.name,
        metric: 'revenue',
        value: service.revenue,
        rank: index + 1,
      })),
      barbershops: topBarbershops.map((shop, index) => ({
        id: shop.id,
        name: shop.name,
        metric: 'appointments_completed',
        value: shop.count,
        rank: index + 1,
      })),
    };
  }

  /**
   * Limpa cache de métricas
   */
  public async clearMetricCache(tenantId?: string): Promise<void> {
    try {
      if (tenantId) {
        const pattern = `metric:${tenantId}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        const pattern = 'metric:*';
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      logger.info('Metric cache cleared', { tenantId });
    } catch (error) {
      logger.error('Failed to clear metric cache', { error });
    }
  }
}

// Exporta instância singleton
export const reportingService = ReportingService.getInstance();
