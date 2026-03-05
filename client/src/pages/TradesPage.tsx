import { useEffect, useState, useCallback } from 'react';
import type {
  Trade,
  Account,
  Asset,
  Strategy,
  TradeFilters,
  TradeDirection,
  TradeStatus,
  Period,
} from '../types';
import { tradesService } from '../services/tradesService';
import { accountsService } from '../services/accountsService';
import { assetsService } from '../services/assetsService';
import { strategiesService } from '../services/strategiesService';
import { useAppContext, useToast } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import { CloseTradeModal } from '../components/CloseTradeModal';
import { NewTradeModal } from '../components/NewTradeModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatNum(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—';
  return n.toFixed(decimals);
}

type SortKey = 'entry_date' | 'asset_symbol' | 'direction' | 'position_size' | 'entry_price' | 'exit_price' | 'pnl' | 'status';

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ label, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-primary font-semibold text-base mb-2">Eliminar trade</h3>
        <p className="text-secondary text-sm mb-5">{label}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-medium text-base bg-danger-strong hover:opacity-90 rounded-lg transition-opacity">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TradesPage ────────────────────────────────────────────────────────────────

const LIMITS = [10, 20, 50];
const PERIODS: { value: Period | ''; label: string }[] = [
  { value: '', label: 'Todos los períodos' },
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
];

export function TradesPage() {
  const { state } = useAppContext();
  const toast = useToast();
  const pageRef = usePageAnimation();

  // Catálogos para los filtros
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  // Datos de la tabla
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filtros locales (se sincronizan con el estado global al aplicar)
  const [filters, setFilters] = useState<TradeFilters>({
    account_id: state.activeAccountId ?? undefined,
    page: 1,
    limit: 20,
  });

  // Ordenamiento
  const [sortKey, setSortKey] = useState<SortKey>('entry_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modales
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [closeTarget, setCloseTarget] = useState<Trade | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null);

  // Cargar catálogos
  useEffect(() => {
    Promise.all([accountsService.list(), assetsService.list(), strategiesService.list()])
      .then(([accs, ass, strats]) => {
        setAccounts(accs);
        setAssets(ass);
        setStrategies(strats);
      })
      .catch(() => {/* catálogos no críticos */ });
  }, []);

  // Actualizar filtro de cuenta cuando cambia la cuenta activa en el context
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      account_id: state.activeAccountId ?? undefined,
      page: 1,
    }));
  }, [state.activeAccountId]);

  const fetchTrades = useCallback(async (f: TradeFilters) => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await tradesService.list(f);
      setTrades(res.data);
      setTotal(res.total);
    } catch {
      setLoadError('No se pudieron cargar los trades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrades(filters); }, [filters, fetchTrades]);

  // ── Filtros ────────────────────────────────────────────────────────────────

  function setFilter(key: keyof TradeFilters, value: string | number | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  function resetFilters() {
    setFilters({ account_id: state.activeAccountId ?? undefined, page: 1, limit: filters.limit });
  }

  // ── Ordenamiento (client-side sobre los datos de la página actual) ─────────

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sortedTrades = [...trades].sort((a, b) => {
    let av: string | number | null = null;
    let bv: string | number | null = null;
    switch (sortKey) {
      case 'entry_date': av = a.entry_date; bv = b.entry_date; break;
      case 'asset_symbol': av = a.asset_symbol ?? ''; bv = b.asset_symbol ?? ''; break;
      case 'direction': av = a.direction; bv = b.direction; break;
      case 'position_size': av = a.position_size; bv = b.position_size; break;
      case 'entry_price': av = a.entry_price; bv = b.entry_price; break;
      case 'exit_price': av = a.exit_price ?? -Infinity; bv = b.exit_price ?? -Infinity; break;
      case 'pnl': av = a.pnl ?? -Infinity; bv = b.pnl ?? -Infinity; break;
      case 'status': av = a.status; bv = b.status; break;
    }
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // ── Acciones ───────────────────────────────────────────────────────────────

  function handleClosed(updated: Trade) {
    setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setCloseTarget(null);
    toast('Trade cerrado correctamente');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await tradesService.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchTrades(filters);
      toast('Trade eliminado');
    } catch (err) {
      setDeleteTarget(null);
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  }

  // ── Exportación ───────────────────────────────────────────────────────────

  function buildExportQuery() {
    const p = new URLSearchParams();
    if (filters.account_id) p.set('account_id', String(filters.account_id));
    if (filters.asset_id) p.set('asset_id', String(filters.asset_id));
    if (filters.strategy_id) p.set('strategy_id', String(filters.strategy_id));
    if (filters.direction) p.set('direction', filters.direction);
    if (filters.status) p.set('status', filters.status);
    if (filters.period) p.set('period', filters.period);
    return p.toString() ? `?${p.toString()}` : '';
  }

  function downloadExport(format: 'csv' | 'excel') {
    window.open(`/api/export/${format}${buildExportQuery()}`, '_blank');
  }

  // ── Paginación ─────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / (filters.limit ?? 20));
  const currentPage = filters.page ?? 1;

  // ── SortHeader ─────────────────────────────────────────────────────────────

  function SortTh({ label, col }: { label: string; col: SortKey }) {
    const active = sortKey === col;
    return (
      <th
        onClick={() => toggleSort(col)}
        className="px-3 py-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wide cursor-pointer select-none hover:text-primary transition-colors whitespace-nowrap"
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}
      </th>
    );
  }

  const selectCls = 'bg-elevated border border-muted text-primary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand';

  return (
    <div ref={pageRef} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-0.5">Trades</h1>
          <p className="text-secondary text-sm">
            {total > 0 ? `${total} operaci${total === 1 ? 'ón' : 'ones'}` : 'Sin operaciones'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadExport('csv')}
            className="px-3 py-1.5 text-xs font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary transition-colors"
          >
            ↓ CSV
          </button>
          <button
            onClick={() => downloadExport('excel')}
            className="px-3 py-1.5 text-xs font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary transition-colors"
          >
            ↓ Excel
          </button>
          <button
            onClick={() => setShowNewTrade(true)}
            className="px-4 py-1.5 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="bg-surface border border-subtle rounded-xl px-4 py-3 mb-4 flex flex-wrap gap-2 items-center">
        {/* Cuenta */}
        <select
          value={filters.account_id ?? ''}
          onChange={(e) => setFilter('account_id', e.target.value ? Number(e.target.value) : undefined)}
          className={selectCls}
        >
          <option value="">Todas las cuentas</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {/* Activo */}
        <select
          value={filters.asset_id ?? ''}
          onChange={(e) => setFilter('asset_id', e.target.value ? Number(e.target.value) : undefined)}
          className={selectCls}
        >
          <option value="">Todos los activos</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.symbol}</option>)}
        </select>

        {/* Estrategia */}
        <select
          value={filters.strategy_id ?? ''}
          onChange={(e) => setFilter('strategy_id', e.target.value ? Number(e.target.value) : undefined)}
          className={selectCls}
        >
          <option value="">Todas las estrategias</option>
          {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* Dirección */}
        <select
          value={filters.direction ?? ''}
          onChange={(e) => setFilter('direction', e.target.value as TradeDirection | '')}
          className={selectCls}
        >
          <option value="">Long / Short</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>

        {/* Estado */}
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilter('status', e.target.value as TradeStatus | '')}
          className={selectCls}
        >
          <option value="">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="closed">Cerrado</option>
        </select>

        {/* Período */}
        <select
          value={filters.period ?? ''}
          onChange={(e) => setFilter('period', e.target.value as Period | '')}
          className={selectCls}
        >
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <button
          onClick={resetFilters}
          className="text-xs text-dimmed hover:text-secondary transition-colors ml-auto"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Error de carga */}
      {loadError && (
        <div className="text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-4 py-3 mb-4">{loadError}</div>
      )}

      {/* Tabla */}
      <div className="bg-surface border border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-elevated border-b border-subtle" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 border-b border-subtle last:border-0 px-4 flex items-center gap-4">
                <div className="h-3 w-24 bg-elevated rounded" />
                <div className="h-3 w-16 bg-elevated rounded" />
                <div className="h-4 w-12 bg-elevated rounded-full" />
                <div className="h-3 w-14 bg-elevated rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-secondary text-sm mb-4">No se encontraron operaciones con los filtros actuales</p>
            <button onClick={resetFilters} className="text-xs text-brand hover:underline">Limpiar filtros</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="bg-elevated border-b border-subtle">
                  <SortTh label="Fecha entrada" col="entry_date" />
                  <SortTh label="Activo" col="asset_symbol" />
                  <SortTh label="Dir." col="direction" />
                  <SortTh label="Lotes" col="position_size" />
                  <SortTh label="Entrada" col="entry_price" />
                  <SortTh label="Salida" col="exit_price" />
                  <SortTh label="PnL" col="pnl" />
                  <SortTh label="Estado" col="status" />
                  <th className="px-3 py-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wide whitespace-nowrap">Estrategia</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-tertiary uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map((trade) => {
                  const pnlPos = trade.pnl != null && trade.pnl >= 0;
                  return (
                    <tr key={trade.id} className="border-b border-subtle last:border-0 hover:bg-elevated/40 transition-colors">
                      <td className="px-3 py-2.5 text-secondary whitespace-nowrap text-xs">{formatDate(trade.entry_date)}</td>
                      <td className="px-3 py-2.5 font-semibold text-primary whitespace-nowrap">{trade.asset_symbol ?? `#${trade.asset_id}`}</td>
                      <td className="px-3 py-2.5">
                        <span className={['text-xs font-semibold', trade.direction === 'long' ? 'text-profit' : 'text-loss'].join(' ')}>
                          {trade.direction === 'long' ? '▲ Long' : '▼ Short'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-secondary text-right">{trade.position_size}</td>
                      <td className="px-3 py-2.5 text-secondary text-right tabular-nums">{formatNum(trade.entry_price, 5)}</td>
                      <td className="px-3 py-2.5 text-secondary text-right tabular-nums">{formatNum(trade.exit_price, 5)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        {trade.pnl != null ? (
                          <span className={pnlPos ? 'text-profit' : 'text-loss'}>
                            {pnlPos ? '+' : ''}{formatNum(trade.pnl)}
                          </span>
                        ) : <span className="text-dimmed">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={[
                          'text-xs font-medium px-2 py-0.5 rounded-full border',
                          trade.status === 'open'
                            ? 'text-neutral bg-neutral-bg border-neutral/20'
                            : 'text-secondary bg-elevated border-muted',
                        ].join(' ')}>
                          {trade.status === 'open' ? 'Abierto' : 'Cerrado'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-secondary text-xs">{trade.strategy_name ?? <span className="text-dimmed">—</span>}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {trade.status === 'open' && (
                            <button
                              onClick={() => setCloseTarget(trade)}
                              className="text-xs text-brand hover:opacity-80 bg-brand-subtle border border-brand/20 rounded-md px-2 py-0.5 transition-opacity whitespace-nowrap"
                            >
                              Cerrar
                            </button>
                          )}
                          <button
                            onClick={() => { setActionError(''); setDeleteTarget(trade); }}
                            className="text-xs text-danger hover:opacity-80 bg-loss-bg border border-loss/20 rounded-md px-2 py-0.5 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span>Filas:</span>
            <select
              value={filters.limit ?? 20}
              onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
              className={selectCls}
            >
              {LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page! - 1 }))}
              className="px-3 py-1 text-xs text-secondary bg-elevated border border-muted rounded-lg disabled:opacity-40 hover:text-primary transition-colors"
            >
              ‹ Anterior
            </button>
            <span className="px-3 text-xs text-secondary">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page! + 1 }))}
              className="px-3 py-1 text-xs text-secondary bg-elevated border border-muted rounded-lg disabled:opacity-40 hover:text-primary transition-colors"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}

      {/* Modal nuevo trade */}
      {showNewTrade && (
        <NewTradeModal
          onClose={() => setShowNewTrade(false)}
          onCreated={() => { setShowNewTrade(false); fetchTrades(filters); toast('Trade creado correctamente'); }}
        />
      )}

      {/* Modal cerrar trade */}
      {closeTarget && (
        <CloseTradeModal
          trade={closeTarget}
          onClose={() => setCloseTarget(null)}
          onClosed={handleClosed}
        />
      )}

      {/* Modal confirmar borrado */}
      {deleteTarget && (
        <ConfirmDialog
          label={`¿Eliminar el trade de ${deleteTarget.asset_symbol ?? `activo #${deleteTarget.asset_id}`} del ${formatDate(deleteTarget.entry_date)}? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
