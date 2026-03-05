import { useEffect, useState } from 'react';
import type { Account, Asset, Strategy, Trade, TradeDirection } from '../types';
import { accountsService } from '../services/accountsService';
import { assetsService } from '../services/assetsService';
import { strategiesService } from '../services/strategiesService';
import { tradesService } from '../services/tradesService';
import { useAppContext } from '../context/AppContext';

interface NewTradeModalProps {
  onClose: () => void;
  onCreated: (trade: Trade) => void;
  onUpdated?: (trade: Trade) => void;
  trade?: Trade; // si se pasa = modo edición
}

interface FormData {
  account_id: string;
  asset_id: string;
  strategy_id: string;
  direction: TradeDirection;
  entry_date: string;
  exit_date: string;
  entry_price: string;
  exit_price: string;
  position_size: string;
  stop_loss: string;
  take_profit: string;
  swap: string;
  commission: string;
  rollover: string;
  comment: string;
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dbDateToLocalInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return toLocalDatetimeValue(new Date(dateStr));
}

export function NewTradeModal({ onClose, onCreated, onUpdated, trade }: NewTradeModalProps) {
  const { state } = useAppContext();
  const isEdit = trade != null;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState<FormData>(() => {
    if (trade) {
      return {
        account_id: String(trade.account_id),
        asset_id: String(trade.asset_id),
        strategy_id: trade.strategy_id ? String(trade.strategy_id) : '',
        direction: trade.direction,
        entry_date: dbDateToLocalInput(trade.entry_date),
        exit_date: dbDateToLocalInput(trade.exit_date),
        entry_price: String(trade.entry_price),
        exit_price: trade.exit_price != null ? String(trade.exit_price) : '',
        position_size: String(trade.position_size),
        stop_loss: trade.stop_loss != null ? String(trade.stop_loss) : '',
        take_profit: trade.take_profit != null ? String(trade.take_profit) : '',
        swap: String(trade.swap),
        commission: String(trade.commission),
        rollover: String(trade.rollover),
        comment: trade.comment ?? '',
      };
    }
    return {
      account_id: state.activeAccountId ? String(state.activeAccountId) : '',
      asset_id: '',
      strategy_id: '',
      direction: 'long',
      entry_date: toLocalDatetimeValue(new Date()),
      exit_date: '',
      entry_price: '',
      exit_price: '',
      position_size: '',
      stop_loss: '',
      take_profit: '',
      swap: '',
      commission: '',
      rollover: '',
      comment: '',
    };
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Cargar catálogos
  useEffect(() => {
    Promise.all([
      accountsService.list(),
      assetsService.list(),
      strategiesService.list(),
    ])
      .then(([accs, ass, strats]) => {
        setAccounts(accs);
        setAssets(ass);
        setStrategies(strats);
        if (!state.activeAccountId && accs.length > 0) {
          setForm((prev) => ({ ...prev, account_id: String(accs[0].id) }));
        }
      })
      .catch(() => setLoadError('Error al cargar datos del formulario'))
      .finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function setDirection(dir: TradeDirection) {
    setForm((prev) => ({ ...prev, direction: dir }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.account_id) { setError('Debes seleccionar una cuenta'); return; }
    if (!form.asset_id) { setError('Debes seleccionar un activo'); return; }
    if (!form.entry_date) { setError('La fecha de entrada es requerida'); return; }

    const entry_price = parseFloat(form.entry_price);
    if (!form.entry_price || isNaN(entry_price) || entry_price <= 0) {
      setError('El precio de entrada debe ser un número positivo');
      return;
    }

    const position_size = parseFloat(form.position_size);
    if (!form.position_size || isNaN(position_size) || position_size <= 0) {
      setError('El tamaño de posición debe ser un número positivo');
      return;
    }

    // Salida: si uno de los dos está, ambos son requeridos
    const hasExitDate = form.exit_date.trim() !== '';
    const hasExitPrice = form.exit_price.trim() !== '';
    if (hasExitDate && !hasExitPrice) { setError('Si ingresas fecha de salida, debes ingresar el precio de salida'); return; }
    if (hasExitPrice && !hasExitDate) { setError('Si ingresas precio de salida, debes ingresar la fecha de salida'); return; }

    const exit_price = hasExitPrice ? parseFloat(form.exit_price) : undefined;
    if (exit_price !== undefined && (isNaN(exit_price) || exit_price <= 0)) {
      setError('El precio de salida debe ser un número positivo');
      return;
    }

    const stop_loss = form.stop_loss.trim() !== '' ? parseFloat(form.stop_loss) : undefined;
    const take_profit = form.take_profit.trim() !== '' ? parseFloat(form.take_profit) : undefined;
    if (stop_loss !== undefined && isNaN(stop_loss)) { setError('Stop Loss inválido'); return; }
    if (take_profit !== undefined && isNaN(take_profit)) { setError('Take Profit inválido'); return; }

    const toDbDate = (local: string) => new Date(local).toISOString().slice(0, 19).replace('T', ' ');

    const payload = {
      account_id: Number(form.account_id),
      asset_id: Number(form.asset_id),
      strategy_id: form.strategy_id ? Number(form.strategy_id) : null,
      direction: form.direction,
      entry_date: toDbDate(form.entry_date),
      exit_date: hasExitDate ? toDbDate(form.exit_date) : null,
      entry_price,
      exit_price: exit_price ?? null,
      position_size,
      stop_loss: stop_loss ?? null,
      take_profit: take_profit ?? null,
      swap: form.swap.trim() !== '' ? parseFloat(form.swap) : 0,
      commission: form.commission.trim() !== '' ? parseFloat(form.commission) : 0,
      rollover: form.rollover.trim() !== '' ? parseFloat(form.rollover) : 0,
      comment: form.comment.trim() || null,
    };

    setSubmitting(true);
    try {
      if (isEdit && trade) {
        const updated = await tradesService.update(trade.id, payload);
        onUpdated?.(updated);
      } else {
        const created = await tradesService.create(payload);
        onCreated(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Error al actualizar el trade' : 'Error al registrar el trade');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle sticky top-0 bg-surface z-10">
          <h2 className="text-primary font-semibold text-lg">{isEdit ? 'Editar trade' : 'Nuevo trade'}</h2>
          <button onClick={onClose} className="text-tertiary hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        {loadingData ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-elevated rounded-lg" />)}
          </div>
        ) : loadError ? (
          <div className="p-6">
            <p className="text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-4 py-3">{loadError}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Cuenta + Activo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Cuenta *</label>
                <select name="account_id" value={form.account_id} onChange={handleChange} className={inputCls}>
                  <option value="">— Seleccionar —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Activo *</label>
                <select name="asset_id" value={form.asset_id} onChange={handleChange} className={inputCls}>
                  <option value="">— Seleccionar —</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.symbol}{a.name ? ` — ${a.name}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estrategia + Dirección */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Estrategia <span className="text-dimmed normal-case">(opcional)</span></label>
                <select name="strategy_id" value={form.strategy_id} onChange={handleChange} className={inputCls}>
                  <option value="">— Sin estrategia —</option>
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Dirección *</label>
                <div className="flex rounded-lg overflow-hidden border border-muted">
                  <button
                    type="button"
                    onClick={() => setDirection('long')}
                    className={[
                      'flex-1 py-2 text-sm font-semibold transition-colors',
                      form.direction === 'long'
                        ? 'bg-profit text-base'
                        : 'bg-elevated text-secondary hover:text-primary',
                    ].join(' ')}
                  >
                    ▲ Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('short')}
                    className={[
                      'flex-1 py-2 text-sm font-semibold transition-colors',
                      form.direction === 'short'
                        ? 'bg-loss text-base'
                        : 'bg-elevated text-secondary hover:text-primary',
                    ].join(' ')}
                  >
                    ▼ Short
                  </button>
                </div>
              </div>
            </div>

            {/* Fechas de entrada y salida */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha y hora de entrada *</label>
                <input
                  type="datetime-local"
                  name="entry_date"
                  value={form.entry_date}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Fecha y hora de salida <span className="text-dimmed normal-case">(opcional)</span></label>
                <input
                  type="datetime-local"
                  name="exit_date"
                  value={form.exit_date}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Precio de entrada y salida */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Precio de entrada *</label>
                <input
                  type="number"
                  name="entry_price"
                  value={form.entry_price}
                  onChange={handleChange}
                  placeholder="0.00000"
                  step="any"
                  min="0"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Precio de salida <span className="text-dimmed normal-case">(opcional)</span></label>
                <input
                  type="number"
                  name="exit_price"
                  value={form.exit_price}
                  onChange={handleChange}
                  placeholder="0.00000"
                  step="any"
                  min="0"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Tamaño de posición */}
            <div>
              <label className={labelCls}>Tamaño (lotaje) *</label>
              <input
                type="number"
                name="position_size"
                value={form.position_size}
                onChange={handleChange}
                placeholder="0.01"
                step="0.01"
                min="0"
                className={inputCls}
              />
            </div>

            {/* Swap + Comisiones + Rollover */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Swap</label>
                <input
                  type="number"
                  name="swap"
                  value={form.swap}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Comisiones</label>
                <input
                  type="number"
                  name="commission"
                  value={form.commission}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="any"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Rollover</label>
                <input
                  type="number"
                  name="rollover"
                  value={form.rollover}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="any"
                  className={inputCls}
                />
              </div>
            </div>

            {/* SL + TP */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Stop Loss <span className="text-dimmed normal-case">(opcional)</span></label>
                <input
                  type="number"
                  name="stop_loss"
                  value={form.stop_loss}
                  onChange={handleChange}
                  placeholder="0.00000"
                  step="any"
                  min="0"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Take Profit <span className="text-dimmed normal-case">(opcional)</span></label>
                <input
                  type="number"
                  name="take_profit"
                  value={form.take_profit}
                  onChange={handleChange}
                  placeholder="0.00000"
                  step="any"
                  min="0"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Comentario */}
            <div>
              <label className={labelCls}>Notas / comentario <span className="text-dimmed normal-case">(opcional)</span></label>
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                rows={3}
                placeholder="Setup, razonamiento, notas..."
                className={`${inputCls} resize-none`}
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
                className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (isEdit ? 'Guardando...' : 'Registrando...') : (isEdit ? 'Guardar cambios' : 'Registrar trade')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
