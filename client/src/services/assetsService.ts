import { api } from './api';
import type { Asset, AssetType } from '../types';

export const assetsService = {
  list: () =>
    api.get<Asset[]>('/assets'),

  getById: (id: number) =>
    api.get<Asset>(`/assets/${id}`),

  create: (data: { symbol: string; name?: string; type: AssetType; pip_value?: number }) =>
    api.post<Asset>('/assets', data),

  update: (
    id: number,
    data: Partial<{ symbol: string; name: string; type: AssetType; pip_value: number }>,
  ) => api.put<Asset>(`/assets/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/assets/${id}`),
};
