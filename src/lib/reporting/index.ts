// Sistema de relatórios e métricas
export { ReportingService, reportingService } from './reporting-service';

// Tipos
export type {
  MetricType,
  MetricFilter,
  MetricConfig,
  MetricResult,
  Report,
  ReportFilters,
  Dashboard,
  DashboardLayout,
  DashboardWidget,
  WidgetConfig,
  ChartData,
  ChartDataset,
  PerformanceReport,
  TrendPoint,
  TopPerformer,
  ExportConfig,
} from '@/types/reporting';

// Funções utilitárias
export {
  isValidMetricType,
  isValidDateFilter,
  calculateDateRange,
  formatMetricValue,
  calculateTrend,
} from '@/types/reporting';
