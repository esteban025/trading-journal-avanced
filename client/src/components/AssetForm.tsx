import { useEffect, useState } from 'react';
import type { Asset, AssetType } from '../types';
import { assetsService } from '../services/assetsService';
import { XMarkIcon } from '../assets/icons/icons-react';
import { useModalAnimation } from '../hooks/useModalAnimation';

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
  const boxRef = useModalAnimation();
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
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={boxRef} className="modal-box max-w-md">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-primary font-semibold text-lg">
            {isEdit ? 'Editar activo' : 'Nuevo activo'}
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
          {/* Símbolo */}
          <div>
            <label className="form-label">Símbolo *</label>
            <input
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              placeholder="Ej: EURUSD, BTC, SPX500"
              className="form-input uppercase"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="form-label">
              Nombre <span className="text-dimmed normal-case">(opcional)</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Euro / Dólar, Bitcoin"
              className="form-input"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="form-label">Tipo *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="form-input"
            >
              {ASSET_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Pip Value */}
          <div>
            <label className="form-label">
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
              className="form-input"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {/* Acciones */}
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
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear activo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
