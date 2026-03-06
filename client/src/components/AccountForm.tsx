import { useEffect, useState } from 'react';
import type { Account } from '../types';
import { accountsService } from '../services/accountsService';
import { XMarkIcon } from '../assets/icons/icons-react';

interface AccountFormProps {
  account?: Account;
  onClose: () => void;
  onSaved: (account: Account) => void;
}

interface FormData {
  name: string;
  currency: string;
  initial_balance: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];

export function AccountForm({ account, onClose, onSaved }: AccountFormProps) {
  const isEdit = !!account;
  const [form, setForm] = useState<FormData>({
    name: account?.name ?? '',
    currency: account?.currency ?? 'USD',
    initial_balance: account ? String(account.initial_balance) : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    const balance = parseFloat(form.initial_balance);
    if (isNaN(balance) || balance < 0) { setError('El balance inicial debe ser un número positivo'); return; }

    setLoading(true);
    try {
      const payload = { name: form.name.trim(), currency: form.currency, initial_balance: balance };
      const saved = isEdit
        ? await accountsService.update(account.id, payload)
        : await accountsService.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-primary font-semibold text-lg">
            {isEdit ? 'Editar cuenta' : 'Nueva cuenta'}
          </h2>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-primary transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Nombre de la cuenta *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Cuenta XTB, Interactive Brokers"
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed"
            />
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Moneda
            </label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Balance inicial */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Balance inicial *
            </label>
            <input
              name="initial_balance"
              type="number"
              min="0"
              step="0.01"
              value={form.initial_balance}
              onChange={handleChange}
              placeholder="10000.00"
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-danger text-sm bg-loss-bg border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-muted text-secondary hover:text-primary hover:bg-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-brand-strong hover:bg-brand text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
