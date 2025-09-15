// Tipos para o sistema de relatórios baseados no reporting.json

// ===== TIPOS DE MÉTRICAS =====
export type MetricType = 'count' | 'ratio' | 'sum' | 'average' | 'min' | 'max' | 'trend' | 'percentage';

// ===== FILTROS DE MÉTRICAS =====
export interface MetricFilter {
  status_in?: string[];
  date?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_7d' | 'last_30d' | 'last_90d';
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  tenant_id?: string;
  barbershop_id?: string;
  employee_id?: string;
  service_id?: string;
  [key: string]: any; // Filtros dinâmicos
}

// ===== CONFIGURAÇÃO DE MÉTRICAS =====
export interface MetricConfig {
  type: MetricType;
  source: string; // Nome da tabela
  filter?: MetricFilter;
  window_days?: number; // Para métricas com janela de tempo
  group_by?: string[]; // Campos para agrupamento
  order_by?: string[]; // Campos para ordenação
  limit?: number; // Limite de resultados
  cache_ttl?: number; // TTL do cache em segundos
}

// ===== RESULTADO DE MÉTRICA =====
export interface MetricResult {
  metric: string;
  value: number;
  unit?: string;
  formatted_value: string;
  metadata?: {
    count?: number;
    percentage?: number;
    trend?: 'up' | 'down' | 'stable';
    trend_value?: number;
    last_updated: Date;
  };
}

// ===== RELATÓRIO COMPLETO =====
export interface Report {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  metrics: MetricResult[];
  filters: ReportFilters;
  generated_at: Date;
  expires_at?: Date;
  metadata?: Record<string, any>;
}

// ===== FILTROS DE RELATÓRIO =====
export interface ReportFilters {
  date_range: {
    start: Date;
    end: Date;
  };
  barbershops?: string[];
  employees?: string[];
  services?: string[];
  statuses?: string[];
  custom_filters?: Record<string, any>;
}

// ===== DASHBOARD =====
export interface Dashboard {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  created_at: Date;
  updated_at: Date;
  is_public?: boolean;
  shared_with?: string[]; // IDs de usuários
}

// ===== LAYOUT DO DASHBOARD =====
export interface DashboardLayout {
  columns: number;
  rows: number;
  grid_gap: number;
  responsive: boolean;
}

// ===== WIDGET DO DASHBOARD =====
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'custom';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  data?: any;
  last_refresh?: Date;
}

// ===== CONFIGURAÇÃO DE WIDGET =====
export interface WidgetConfig {
  metric_id?: string;
  chart_type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  refresh_interval?: number; // em segundos
  show_trend?: boolean;
  show_percentage?: boolean;
  custom_query?: string;
  [key: string]: any;
}

// ===== TIPOS DE GRÁFICOS =====
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

// ===== RELATÓRIO DE PERFORMANCE =====
export interface PerformanceReport {
  tenant_id: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    total_appointments: number;
    confirmed_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    no_shows: number;
    total_revenue: number;
    average_rating: number;
  };
  metrics: {
    booking_rate: number;
    completion_rate: number;
    no_show_rate: number;
    revenue_per_appointment: number;
    customer_satisfaction: number;
  };
  trends: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
  top_performers: {
    employees: TopPerformer[];
    services: TopPerformer[];
    barbershops: TopPerformer[];
  };
}

// ===== PONTO DE TENDÊNCIA =====
export interface TrendPoint {
  date: string;
  value: number;
  change?: number;
  change_percentage?: number;
}

// ===== TOP PERFORMER =====
export interface TopPerformer {
  id: string;
  name: string;
  metric: string;
  value: number;
  rank: number;
  change?: number;
}

// ===== CONFIGURAÇÃO DE EXPORTAÇÃO =====
export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  include_charts?: boolean;
  include_metadata?: boolean;
  date_format?: string;
  locale?: string;
}

// ===== FUNÇÕES UTILITÁRIAS =====
export const isValidMetricType = (type: string): type is MetricType => {
  return ['count', 'ratio', 'sum', 'average', 'min', 'max', 'trend'].includes(type);
};

export const isValidDateFilter = (filter: string): boolean => {
  return ['today', 'yesterday', 'this_week', 'this_month', 'last_7d', 'last_30d', 'last_90d'].includes(filter);
};

export const calculateDateRange = (filter: string): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_7d':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_30d':
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_90d':
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

export const formatMetricValue = (value: number, type: MetricType, unit?: string): string => {
  switch (type) {
    case 'count':
      return value.toLocaleString('pt-BR');
    case 'ratio':
    case 'percentage':
      return `${(value * 100).toFixed(2)}%`;
    case 'sum':
      if (unit === 'price_cents') {
        return `R$ ${(value / 100).toFixed(2)}`;
      }
      return value.toLocaleString('pt-BR');
    case 'average':
      return value.toFixed(2);
    default:
      return value.toString();
  }
};

export const calculateTrend = (current: number, previous: number): { direction: 'up' | 'down' | 'stable'; value: number; percentage: number } => {
  if (previous === 0) {
    return { direction: 'stable', value: 0, percentage: 0 };
  }

  const change = current - previous;
  const percentage = (change / previous) * 100;

  if (Math.abs(percentage) < 1) {
    return { direction: 'stable', value: change, percentage };
  }

  return {
    direction: percentage > 0 ? 'up' : 'down',
    value: Math.abs(change),
    percentage: Math.abs(percentage)
  };
};
