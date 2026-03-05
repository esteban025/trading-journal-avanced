import { api } from './api';
import type { Account } from '../types';

export const accountsService = {
  list: () =>
    api.get<Account[]>('/accounts'),

  getById: (id: number) =>
    api.get<Account>(`/accounts/${id}`),

  create: (data: { name: string; currency?: string; initial_balance: number }) =>
    api.post<Account>('/accounts', data),

  update: (id: number, data: Partial<{ name: string; currency: string; initial_balance: number }>) =>
    api.put<Account>(`/accounts/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/accounts/${id}`),
};
