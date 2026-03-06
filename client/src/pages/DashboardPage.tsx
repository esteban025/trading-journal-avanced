import { useEffect, useState, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { metricsService } from '../services/metricsService';
import { accountsService } from '../services/accountsService';
import { useAppContext } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import type { Account, MetricsSummary, EquityPoint, Period } from '../types';
import {
  WalletIcon,
  TrophyIcon,
  ChartBarIcon,
  ScaleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
} from '../assets/icons/icons-react';

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

// ── DashboardPage ─────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { state, dispatch } = useAppContext();
  const pageRef = usePageAnimation();
  const kpiGridRef = useRef<HTMLDivElement>(null);
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

  // Stagger KPI cards al terminar de cargar
  useEffect(() => {
    const grid = kpiGridRef.current;
    if (loading || !grid || grid.children.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(Array.from(grid.children), {
        opacity: 0,
        y: 20,
        scale: 0.97,
        duration: 0.4,
        stagger: 0.07,
        ease: 'power3.out',
        clearProps: 'all',
      });
    }, grid);

    return () => ctx.revert();
  }, [loading]);

  // Cuenta activa para mostrar balance
  const activeAccount = accounts.find((a) => a.id === state.activeAccountId) ?? null;

  // Balance actual = siempre el saldo real de la cuenta (todos los trades cerrados)
  const lastEquityPnl = equity.length > 0 ? equity[equity.length - 1].cumulative_pnl : 0;
  const currentBalance = activeAccount ? activeAccount.current_balance : null;

  const winRate = summary?.win_rate ?? null;
  const profitFactor = summary?.profit_factor ?? null;
  const avgWin = summary?.avg_win ?? null;
  const avgLoss = summary?.avg_loss ?? null;
  const rbRatio = summary?.avg_win_loss_ratio ?? null;
  const totalTrades = summary?.total_closed_trades ?? null;

  return (
    <div ref={pageRef} className="p-6 flex flex-col gap-6">
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
        <div ref={kpiGridRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                ? period
                  ? `PnL período: ${lastEquityPnl >= 0 ? '+' : ''}${lastEquityPnl.toFixed(2)}`
                  : `Inicial: ${activeAccount.currency} ${activeAccount.initial_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : 'Selecciona una cuenta'
            }
            variant={
              currentBalance != null && activeAccount
                ? currentBalance >= activeAccount.initial_balance
                  ? 'profit'
                  : 'loss'
                : 'default'
            }
            icon={<WalletIcon className="w-5 h-5" />}
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
            icon={<TrophyIcon className="w-5 h-5" />}
          />

          {/* Profit Factor */}
          <KpiCard
            label="Profit Factor"
            value={fmt(profitFactor)}
            subLabel={profitFactor != null ? (profitFactor >= 1 ? 'Favorable' : 'Desfavorable') : undefined}
            variant={
              profitFactor == null ? 'default' : profitFactor >= 1 ? 'profit' : 'loss'
            }
            icon={<ChartBarIcon className="w-5 h-5" />}
          />

          {/* Ratio R/B */}
          <KpiCard
            label="Ratio Ganancia/Pérdida"
            value={fmt(rbRatio)}
            subLabel="Promedio win / Promedio loss"
            variant={
              rbRatio == null ? 'default' : rbRatio >= 1 ? 'profit' : 'loss'
            }
            icon={<ScaleIcon className="w-5 h-5" />}
          />

          {/* Ganancia promedio */}
          <KpiCard
            label="Ganancia promedio"
            value={avgWin != null ? `+${fmt(avgWin)}` : '—'}
            variant="profit"
            icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
          />

          {/* Pérdida promedio */}
          <KpiCard
            label="Pérdida promedio"
            value={avgLoss != null ? `-${fmt(Math.abs(avgLoss))}` : '—'}
            variant="loss"
            icon={<ArrowTrendingDownIcon className="w-5 h-5" />}
          />

          {/* Drawdown máximo */}
          <KpiCard
            label="Drawdown máximo"
            value={maxDrawdown > 0 ? `-${fmt(maxDrawdown)}` : '—'}
            subLabel="Caída máxima desde el pico"
            variant={maxDrawdown > 0 ? 'loss' : 'default'}
            icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          />

          {/* Total trades */}
          <KpiCard
            label="Total trades"
            value={totalTrades != null ? String(totalTrades) : '—'}
            subLabel="Trades cerrados"
            variant="neutral"
            icon={<ListBulletIcon className="w-5 h-5" />}
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
