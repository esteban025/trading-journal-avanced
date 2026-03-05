import { api } from './api';
import type { Trade, PaginatedTrades, TradeFilters, CloseTradePayload } from '../types';

function buildQuery(filters: TradeFilters): string {
  const params = new URLSearchParams();
  (Object.entries(filters) as [string, unknown][]).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const tradesService = {
  list: (filters: TradeFilters = {}) =>
    api.get<PaginatedTrades>(`/trades${buildQuery(filters)}`),

  getById: (id: number) =>
    api.get<Trade>(`/trades/${id}`),

  create: (data: Partial<Trade>) =>
    api.post<Trade>('/trades', data),

  update: (id: number, data: Partial<Trade>) =>
    api.put<Trade>(`/trades/${id}`, data),

  close: (id: number, data: CloseTradePayload) =>
    api.put<Trade>(`/trades/${id}/close`, data),

  delete: (id: number) =>
    api.delete<void>(`/trades/${id}`),
};
