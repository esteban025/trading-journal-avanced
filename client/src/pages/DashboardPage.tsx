import { useEffect, useState, useCallback } from 'react';
import { metricsService } from '../services/metricsService';
import { accountsService } from '../services/accountsService';
import { useAppContext } from '../context/AppContext';
import type { Account, MetricsSummary, EquityPoint, Period } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '—';
  return value.toFixed(decimals);
}

function fmtPct(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

/** Calcula el máximo drawdown a partir del array de equity acumulada */
function calcMaxDrawdown(equity: EquityPoint[]): number {
  if (equity.length === 0) return 0;
  let peak = -Infinity;
  let maxDD = 0;
  for (const point of equity) {
    if (point.cumulative_pnl > peak) peak = point.cumulative_pnl;
    const dd = peak - point.cumulative_pnl;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  subLabel?: string;
  variant?: 'default' | 'profit' | 'loss' | 'neutral';
  icon: React.ReactNode;
}

function KpiCard({ label, value, subLabel, variant = 'default', icon }: KpiCardProps) {
  const valueColor =
    variant === 'profit'
      ? 'text-profit'
      : variant === 'loss'
        ? 'text-loss'
        : variant === 'neutral'
          ? 'text-neutral'
          : 'text-primary';

  return (
    <div className="bg-surface border border-subtle rounded-xl p-5 flex flex-col gap-3 hover:border-muted transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-tertiary text-xs font-medium uppercase tracking-wide">{label}</span>
        <span className="text-dimmed">{icon}</span>
      </div>
      <div>
        <span className={`text-2xl font-bold ${valueColor}`}>{value}</span>
        {subLabel && <p className="text-tertiary text-xs mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

// ── Selector de período ───────────────────────────────────────────────────────

const PERIODS: { value: Period | ''; label: string }[] = [
  { value: '', label: 'Todo el tiempo' },
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconWallet() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V9" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  );
}
function IconChartBar() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
function IconArrowTrend() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}
function IconArrowDown() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
    </svg>
  );
}
function IconExclamation() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}
function IconList() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}
function IconScale() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 4.608a.75.75 0 0 1-.68 1.022H15.75M18.75 4.97l-2.62 4.608m0 0a3 3 0 0 1-5.26 0m5.26 0-2.63-4.608M12 12.75a3 3 0 0 1-3-3 3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3Z" />
    </svg>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { state, dispatch } = useAppContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [period, setPeriod] = useState<Period | ''>('');
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar cuentas disponibles al montar
  useEffect(() => {
    accountsService.list().then(setAccounts).catch(() => { });
  }, []);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        account_id: state.activeAccountId ?? undefined,
        period: period || undefined,
      };
      const [summaries, equityData] = await Promise.all([
        metricsService.summary(filters),
        metricsService.equityCurve(filters),
      ]);

      // Si hay cuenta activa tomamos esa fila, si no tomamos la primera (global)
      const row = state.activeAccountId
        ? summaries.find((s) => s.account_id === state.activeAccountId) ?? summaries[0] ?? null
        : summaries[0] ?? null;

      setSummary(row);
      setEquity(equityData);
      setMaxDrawdown(calcMaxDrawdown(equityData));
    } catch {
      setError('Error al cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, [state.activeAccountId, period]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Cuenta activa para mostrar balance
  const activeAccount = accounts.find((a) => a.id === state.activeAccountId) ?? null;

  // Balance actual = initial_balance + cumulative_pnl del último punto de equity
  const lastEquityPnl = equity.length > 0 ? equity[equity.length - 1].cumulative_pnl : 0;
  const currentBalance = activeAccount
    ? activeAccount.initial_balance + lastEquityPnl
    : null;

  const winRate = summary?.win_rate ?? null;
  const profitFactor = summary?.profit_factor ?? null;
  const avgWin = summary?.avg_win ?? null;
  const avgLoss = summary?.avg_loss ?? null;
  const rbRatio = summary?.avg_win_loss_ratio ?? null;
  const totalTrades = summary?.total_closed_trades ?? null;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">Dashboard</h1>
        <p className="text-secondary text-sm">Resumen de métricas y rendimiento</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Selector de cuenta */}
        <div className="flex flex-col gap-1">
          <label className="text-tertiary text-xs uppercase tracking-wide font-medium">Cuenta</label>
          <select
            className="bg-surface border border-subtle text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand transition-colors"
            value={state.activeAccountId ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: val });
            }}
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de período */}
        <div className="flex flex-col gap-1">
          <label className="text-tertiary text-xs uppercase tracking-wide font-medium">Período</label>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as Period | '')}
                className={[
                  'px-3 py-2 text-xs rounded-lg border transition-colors',
                  period === p.value
                    ? 'bg-brand-subtle border-brand text-brand font-semibold'
                    : 'bg-surface border-subtle text-secondary hover:text-primary hover:border-muted',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-loss-bg border border-loss/20 text-loss text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-subtle rounded-xl p-5 h-28 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Balance actual */}
          <KpiCard
            label="Balance actual"
            value={
              currentBalance != null
                ? `${activeAccount?.currency ?? ''} ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'
            }
            subLabel={
              activeAccount
                ? `Inicial: ${activeAccount.currency} ${activeAccount.initial_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : 'Selecciona una cuenta'
            }
            variant={
              currentBalance != null && activeAccount
                ? currentBalance >= activeAccount.initial_balance
                  ? 'profit'
                  : 'loss'
                : 'default'
            }
            icon={<IconWallet />}
          />

          {/* Win rate */}
          <KpiCard
            label="Win Rate"
            value={fmtPct(winRate)}
            subLabel={
              summary
                ? `${summary.total_wins}W / ${summary.total_losses}L`
                : undefined
            }
            variant={
              winRate == null ? 'default' : winRate >= 50 ? 'profit' : 'loss'
            }
            icon={<IconTrophy />}
          />

          {/* Profit Factor */}
          <KpiCard
            label="Profit Factor"
            value={fmt(profitFactor)}
            subLabel={profitFactor != null ? (profitFactor >= 1 ? 'Favorable' : 'Desfavorable') : undefined}
            variant={
              profitFactor == null ? 'default' : profitFactor >= 1 ? 'profit' : 'loss'
            }
            icon={<IconChartBar />}
          />

          {/* Ratio R/B */}
          <KpiCard
            label="Ratio Ganancia/Pérdida"
            value={fmt(rbRatio)}
            subLabel="Promedio win / Promedio loss"
            variant={
              rbRatio == null ? 'default' : rbRatio >= 1 ? 'profit' : 'loss'
            }
            icon={<IconScale />}
          />

          {/* Ganancia promedio */}
          <KpiCard
            label="Ganancia promedio"
            value={avgWin != null ? `+${fmt(avgWin)}` : '—'}
            variant="profit"
            icon={<IconArrowTrend />}
          />

          {/* Pérdida promedio */}
          <KpiCard
            label="Pérdida promedio"
            value={avgLoss != null ? `-${fmt(Math.abs(avgLoss))}` : '—'}
            variant="loss"
            icon={<IconArrowDown />}
          />

          {/* Drawdown máximo */}
          <KpiCard
            label="Drawdown máximo"
            value={maxDrawdown > 0 ? `-${fmt(maxDrawdown)}` : '—'}
            subLabel="Caída máxima desde el pico"
            variant={maxDrawdown > 0 ? 'loss' : 'default'}
            icon={<IconExclamation />}
          />

          {/* Total trades */}
          <KpiCard
            label="Total trades"
            value={totalTrades != null ? String(totalTrades) : '—'}
            subLabel="Trades cerrados"
            variant="neutral"
            icon={<IconList />}
          />
        </div>
      )}

      {/* Equity résumé */}
      {!loading && equity.length > 0 && (
        <div className="bg-surface border border-subtle rounded-xl p-5">
          <h2 className="text-primary font-semibold text-sm mb-3">
            PnL neto acumulado
          </h2>
          <div className="flex items-end gap-1 h-16 overflow-hidden">
            {(() => {
              const values = equity.map((e) => e.cumulative_pnl);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const range = max - min || 1;
              return equity.map((point, i) => {
                const height = ((point.cumulative_pnl - min) / range) * 100;
                const isPositive = point.cumulative_pnl >= 0;
                return (
                  <div
                    key={i}
                    title={`${point.exit_date}: ${point.cumulative_pnl >= 0 ? '+' : ''}${point.cumulative_pnl.toFixed(2)}`}
                    className={[
                      'flex-1 rounded-sm transition-all',
                      isPositive ? 'bg-profit/60' : 'bg-loss/60',
                    ].join(' ')}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                );
              });
            })()}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-tertiary text-xs">{equity[0]?.exit_date ?? ''}</span>
            <span
              className={[
                'text-sm font-semibold',
                lastEquityPnl >= 0 ? 'text-profit' : 'text-loss',
              ].join(' ')}
            >
              {lastEquityPnl >= 0 ? '+' : ''}{lastEquityPnl.toFixed(2)}
            </span>
            <span className="text-tertiary text-xs">{equity[equity.length - 1]?.exit_date ?? ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
