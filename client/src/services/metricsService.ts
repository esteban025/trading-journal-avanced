import { api } from './api';
import type {
  MetricsSummary,
  EquityPoint,
  AssetMetrics,
  StrategyMetrics,
  Period,
} from '../types';

interface MetricsFilters {
  account_id?: number;
  period?: Period;
}

function buildQuery(filters: MetricsFilters): string {
  const params = new URLSearchParams();
  if (filters.account_id !== undefined) params.set('account_id', String(filters.account_id));
  if (filters.period) params.set('period', filters.period);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const metricsService = {
  summary: (filters: MetricsFilters = {}) =>
    api.get<MetricsSummary[]>(`/metrics/summary${buildQuery(filters)}`),

  equityCurve: (filters: MetricsFilters = {}) =>
    api.get<EquityPoint[]>(`/metrics/equity-curve${buildQuery(filters)}`),

  byAsset: (filters: MetricsFilters = {}) =>
    api.get<AssetMetrics[]>(`/metrics/by-asset${buildQuery(filters)}`),

  byStrategy: (filters: MetricsFilters = {}) =>
    api.get<StrategyMetrics[]>(`/metrics/by-strategy${buildQuery(filters)}`),
};
