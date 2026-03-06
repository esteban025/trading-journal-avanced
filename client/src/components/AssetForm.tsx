import { useEffect, useState } from 'react';
import type { Asset, AssetType } from '../types';
import { assetsService } from '../services/assetsService';
import { XMarkIcon } from '../assets/icons/icons-react';

interface AssetFormProps {
  asset?: Asset;
  onClose: () => void;
  onSaved: (asset: Asset) => void;
}

interface FormData {
  symbol: string;
  name: string;
  type: AssetType;
  pip_value: string;
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'forex', label: 'Forex' },
  { value: 'index', label: 'Índice' },
  { value: 'stocks', label: 'Acciones' },
  { value: 'futures', label: 'Futuros' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'commodities', label: 'Commodities' },
];

export function AssetForm({ asset, onClose, onSaved }: AssetFormProps) {
  const isEdit = !!asset;
  const [form, setForm] = useState<FormData>({
    symbol: asset?.symbol ?? '',
    name: asset?.name ?? '',
    type: asset?.type ?? 'forex',
    pip_value: asset?.pip_value != null ? String(asset.pip_value) : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!form.symbol.trim()) { setError('El símbolo es requerido'); return; }

    const pip = form.pip_value.trim() !== '' ? parseFloat(form.pip_value) : undefined;
    if (pip !== undefined && (isNaN(pip) || pip <= 0)) {
      setError('El pip value debe ser un número positivo');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        symbol: form.symbol.trim().toUpperCase(),
        name: form.name.trim() || undefined,
        type: form.type,
        pip_value: pip,
      };
      const saved = isEdit
        ? await assetsService.update(asset.id, payload)
        : await assetsService.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-primary font-semibold text-lg">
            {isEdit ? 'Editar activo' : 'Nuevo activo'}
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
          {/* Símbolo */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Símbolo *
            </label>
            <input
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              placeholder="Ej: EURUSD, BTC, SPX500"
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed uppercase"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Nombre <span className="text-dimmed normal-case">(opcional)</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Euro / Dólar, Bitcoin"
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Tipo *
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {ASSET_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Pip Value */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Pip Value <span className="text-dimmed normal-case">(opcional)</span>
            </label>
            <input
              name="pip_value"
              type="number"
              min="0"
              step="any"
              value={form.pip_value}
              onChange={handleChange}
              placeholder="Ej: 10"
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary hover:border-subtle transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
