import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { metricsService } from '../services/metricsService';
import { accountsService } from '../services/accountsService';
import { useAppContext } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import type { Account, EquityPoint, AssetMetrics, StrategyMetrics, Period } from '../types';
import { ChartBarIcon } from '../assets/icons/icons-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PERIODS: { value: Period | ''; label: string }[] = [
  { value: '', label: 'Todo' },
  { value: 'day', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

const COLOR_PROFIT = '#34d399';  // emerald-400
const COLOR_LOSS = '#f87171';  // red-400
const COLOR_BRAND = '#34d399';

function shortDate(iso: string): string {
  return iso.slice(5, 10); // MM-DD
}

// ── Tooltip personalizado ─────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-elevated border border-subtle rounded-lg px-3 py-2 text-xs shadow-lg">
      {label && <p className="text-tertiary mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="bg-surface border border-subtle rounded-xl p-5 animate-pulse">
      <div className="h-4 w-40 bg-elevated rounded mb-4" />
      <div className="h-52 bg-elevated rounded" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-52 text-tertiary text-sm gap-2">
      <ChartBarIcon className="w-8 h-8 text-dimmed" />
      <span>{message}</span>
    </div>
  );
}

// ── ReportsPage ───────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { state, dispatch } = useAppContext();
  const pageRef = usePageAnimation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [period, setPeriod] = useState<Period | ''>('');

  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [byAsset, setByAsset] = useState<AssetMetrics[]>([]);
  const [byStrategy, setByStrategy] = useState<StrategyMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    accountsService.list().then(setAccounts).catch(() => { });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        account_id: state.activeAccountId ?? undefined,
        period: period || undefined,
      };
      const [eq, asset, strategy] = await Promise.all([
        metricsService.equityCurve(filters),
        metricsService.byAsset(filters),
        metricsService.byStrategy(filters),
      ]);
      setEquity(eq);
      setByAsset(asset);
      setByStrategy(strategy);
    } catch {
      // silencio — los gráficos mostrarán estado vacío
    } finally {
      setLoading(false);
    }
  }, [state.activeAccountId, period]);

  useEffect(() => { load(); }, [load]);

  // Datos formateados para los gráficos
  const equityData = equity.map((p) => ({
    date: shortDate(p.exit_date),
    fullDate: p.exit_date,
    pnl: Number(p.cumulative_pnl),
  }));

  const assetData = byAsset.map((a) => ({
    symbol: a.symbol,
    pnl: Number(a.total_pnl),
    winRate: Number(a.win_rate),
    trades: a.total_trades,
  }));

  const strategyData = byStrategy.map((s) => ({
    name: s.name,
    pnl: Number(s.total_pnl),
    winRate: Number(s.win_rate),
    trades: s.total_trades,
  }));

  return (
    <div ref={pageRef} className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">Reportes</h1>
        <p className="text-secondary text-sm">Gráficos y análisis de rendimiento</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
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
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

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

      {/* ── Curva de equity ── */}
      {loading ? <ChartSkeleton /> : (
        <div className="bg-surface border border-subtle rounded-xl p-5">
          <h2 className="text-primary font-semibold text-sm mb-4">Curva de equity acumulada</h2>
          {equityData.length === 0
            ? <EmptyChart message="Sin trades cerrados en el período" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-subtle)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--color-tertiary)', fontSize: 11 }}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-tertiary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                    tickFormatter={(v: number) => v.toFixed(0)}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <CustomTooltip
                        active={active}
                        payload={payload as TooltipPayloadEntry[]}
                        label={label as string}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    name="PnL acumulado"
                    stroke={COLOR_BRAND}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: COLOR_BRAND }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>
      )}

      {/* ── PnL por activo ── */}
      {loading ? <ChartSkeleton /> : (
        <div className="bg-surface border border-subtle rounded-xl p-5">
          <h2 className="text-primary font-semibold text-sm mb-4">PnL por activo</h2>
          {assetData.length === 0
            ? <EmptyChart message="Sin datos por activo" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={assetData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-subtle)" vertical={false} />
                  <XAxis
                    dataKey="symbol"
                    tick={{ fill: 'var(--color-tertiary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-tertiary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                    tickFormatter={(v: number) => v.toFixed(0)}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <CustomTooltip
                        active={active}
                        payload={payload as TooltipPayloadEntry[]}
                        label={label as string}
                      />
                    )}
                  />
                  <Bar dataKey="pnl" name="PnL" radius={[4, 4, 0, 0]}>
                    {assetData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.pnl >= 0 ? COLOR_PROFIT : COLOR_LOSS}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      )}

      {/* ── Win rate y PnL por estrategia ── */}
      {loading ? <ChartSkeleton /> : (
        <div className="bg-surface border border-subtle rounded-xl p-5">
          <h2 className="text-primary font-semibold text-sm mb-4">Win rate y PnL por estrategia</h2>
          {strategyData.length === 0
            ? <EmptyChart message="Sin datos por estrategia" />
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={strategyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-subtle)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--color-tertiary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="pnl"
                    tick={{ fill: 'var(--color-tertiary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                    tickFormatter={(v: number) => v.toFixed(0)}
                  />
                  <YAxis
                    yAxisId="wr"
                    orientation="right"
                    tick={{ fill: 'var(--color-tertiary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <CustomTooltip
                        active={active}
                        payload={payload as TooltipPayloadEntry[]}
                        label={label as string}
                      />
                    )}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: 'var(--color-secondary)' }}
                  />
                  <Bar yAxisId="pnl" dataKey="pnl" name="PnL" radius={[4, 4, 0, 0]}>
                    {strategyData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.pnl >= 0 ? COLOR_PROFIT : COLOR_LOSS}
                      />
                    ))}
                  </Bar>
                  <Bar yAxisId="wr" dataKey="winRate" name="Win Rate (%)" fill="#60a5fa" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      )}
    </div>
  );
}
