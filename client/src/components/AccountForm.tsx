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
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-primary font-semibold text-lg">
            {isEdit ? 'Editar cuenta' : 'Nueva cuenta'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nombre */}
          <div>
            <label className="form-label">Nombre de la cuenta *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Cuenta XTB, Interactive Brokers"
              className="form-input"
            />
          </div>

          {/* Moneda */}
          <div>
            <label className="form-label">Moneda</label>
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="form-input"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Balance inicial */}
          <div>
            <label className="form-label">Balance inicial *</label>
            <input
              name="initial_balance"
              type="number"
              min="0"
              step="0.01"
              value={form.initial_balance}
              onChange={handleChange}
              placeholder="10000.00"
              className="form-input"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
