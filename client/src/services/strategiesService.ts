import { api } from './api';
import type { Strategy } from '../types';

export const strategiesService = {
  list: () =>
    api.get<Strategy[]>('/strategies'),

  getById: (id: number) =>
    api.get<Strategy>(`/strategies/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post<Strategy>('/strategies', data),

  update: (id: number, data: Partial<{ name: string; description: string }>) =>
    api.put<Strategy>(`/strategies/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/strategies/${id}`),
};
