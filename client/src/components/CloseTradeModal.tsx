import { useEffect, useState } from 'react';
import type { Trade, CloseTradePayload } from '../types';
import { tradesService } from '../services/tradesService';

interface CloseTradeModalProps {
  trade: Trade;
  onClose: () => void;
  onClosed: (updated: Trade) => void;
}

interface FormData {
  exit_price: string;
  exit_date: string;
  swap: string;
  commission: string;
  rollover: string;
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Mismo algoritmo que el backend */
function calcPnl(
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  pipValue: number,
  swap: number,
  commission: number,
  rollover: number,
): number {
  const priceDiff =
    direction === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;
  const gross = priceDiff * positionSize * 100 * pipValue;
  return gross - swap - commission - rollover;
}

export function CloseTradeModal({ trade, onClose, onClosed }: CloseTradeModalProps) {
  const [form, setForm] = useState<FormData>({
    exit_price: '',
    exit_date: toLocalDatetimeValue(new Date()),
    swap: '0',
    commission: '0',
    rollover: '0',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  // ── Preview PnL ────────────────────────────────────────────────────────────
  const exitPrice = parseFloat(form.exit_price);
  const swap = parseFloat(form.swap) || 0;
  const commission = parseFloat(form.commission) || 0;
  const rollover = parseFloat(form.rollover) || 0;
  const pipValue = trade.pip_value ?? 1;

  const previewPnl =
    !isNaN(exitPrice) && exitPrice > 0
      ? calcPnl(trade.direction, trade.entry_price, exitPrice, trade.position_size, pipValue, swap, commission, rollover)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.exit_price || isNaN(exitPrice) || exitPrice <= 0) {
      setError('El precio de salida debe ser un número positivo');
      return;
    }
    if (!form.exit_date) {
      setError('La fecha de salida es requerida');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CloseTradePayload = {
        exit_price: exitPrice,
        exit_date: new Date(form.exit_date).toISOString().slice(0, 19).replace('T', ' '),
        swap: parseFloat(form.swap) || 0,
        commission: parseFloat(form.commission) || 0,
        rollover: parseFloat(form.rollover) || 0,
      };
      const updated = await tradesService.close(trade.id, payload);
      onClosed(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar el trade');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed';
  const labelCls =
    'block text-xs font-medium text-tertiary uppercase tracking-wide mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <div>
            <h2 className="text-primary font-semibold text-lg">Cerrar trade</h2>
            <p className="text-tertiary text-xs mt-0.5">
              {trade.asset_symbol ?? `Activo #${trade.asset_id}`} ·{' '}
              <span className={trade.direction === 'long' ? 'text-profit' : 'text-loss'}>
                {trade.direction === 'long' ? '▲ Long' : '▼ Short'}
              </span>{' '}
              · {trade.position_size} lotes
            </p>
          </div>
          <button onClick={onClose} className="text-tertiary hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Precio de salida + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Precio de salida *</label>
              <input
                name="exit_price"
                type="number"
                step="any"
                min="0"
                value={form.exit_price}
                onChange={handleChange}
                placeholder={String(trade.entry_price)}
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Fecha de salida *</label>
              <input
                name="exit_date"
                type="datetime-local"
                value={form.exit_date}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          {/* Swap + Commission + Rollover */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Swap</label>
              <input
                name="swap"
                type="number"
                step="any"
                value={form.swap}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Comisión</label>
              <input
                name="commission"
                type="number"
                step="any"
                value={form.commission}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Rollover</label>
              <input
                name="rollover"
                type="number"
                step="any"
                value={form.rollover}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
          </div>

          {/* Preview PnL */}
          <div className={[
            'rounded-lg px-4 py-3 border text-sm',
            previewPnl === null
              ? 'bg-elevated border-muted text-secondary'
              : previewPnl >= 0
                ? 'bg-profit-bg border-profit/20'
                : 'bg-loss-bg border-loss/20',
          ].join(' ')}>
            {previewPnl === null ? (
              <span className="text-dimmed">Ingresa precio de salida para ver el PnL estimado</span>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-tertiary">PnL estimado</span>
                <span className={['font-bold text-base', previewPnl >= 0 ? 'text-profit' : 'text-loss'].join(' ')}>
                  {previewPnl >= 0 ? '+' : ''}
                  {previewPnl.toFixed(2)}
                  {trade.pip_value == null && (
                    <span className="text-xs font-normal text-dimmed ml-1">(pip_value=1)</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Referencia de entrada */}
          <div className="text-xs text-tertiary flex gap-4">
            <span>Entrada: <span className="text-secondary">{trade.entry_price}</span></span>
            <span>Pip value: <span className="text-secondary">{pipValue}</span></span>
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
              className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Cerrando...' : 'Confirmar cierre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
