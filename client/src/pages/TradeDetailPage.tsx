import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { tradesService } from '../services/tradesService';
import { useToast } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import { CloseTradeModal } from '../components/CloseTradeModal';
import type { Trade } from '../types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—';
  return n.toFixed(decimals);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-elevated rounded-lg px-4 py-3">
      <p className="text-tertiary text-xs uppercase tracking-wide font-medium mb-1">{label}</p>
      <div className="text-primary text-sm font-medium">{value}</div>
    </div>
  );
}

export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const pageRef = usePageAnimation();

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClose, setShowClose] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTrade = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await tradesService.getById(Number(id));
      setTrade(data);
    } catch {
      setError('No se pudo cargar el trade');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadTrade(); }, [loadTrade]);

  async function handleDelete() {
    if (!trade) return;
    setDeleting(true);
    try {
      await tradesService.delete(trade.id);
      toast('Trade eliminado correctamente');
      navigate('/trades');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div ref={pageRef} className="p-6 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-elevated rounded" />
          <div className="h-8 w-48 bg-elevated rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-16 bg-elevated rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div ref={pageRef} className="p-6">
        <p className="text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-4 py-3 mb-4">
          {error || 'Trade no encontrado'}
        </p>
        <Link to="/trades" className="text-brand text-sm hover:underline">← Volver a trades</Link>
      </div>
    );
  }

  const pnlPos = trade.pnl != null && trade.pnl >= 0;

  return (
    <div ref={pageRef} className="p-6 max-w-3xl">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link
            to="/trades"
            className="text-tertiary text-xs hover:text-secondary transition-colors flex items-center gap-1 mb-2"
          >
            ← Volver a trades
          </Link>
          <h1 className="text-2xl font-bold text-primary">
            {trade.asset_symbol ?? `Activo #${trade.asset_id}`}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={['text-sm font-semibold', trade.direction === 'long' ? 'text-profit' : 'text-loss'].join(' ')}>
              {trade.direction === 'long' ? '▲ Long' : '▼ Short'}
            </span>
            <span className="text-tertiary text-xs">·</span>
            <span className={[
              'text-xs font-medium px-2 py-0.5 rounded-full border',
              trade.status === 'open'
                ? 'text-neutral bg-neutral-bg border-neutral/20'
                : 'text-secondary bg-elevated border-muted',
            ].join(' ')}>
              {trade.status === 'open' ? 'Abierto' : 'Cerrado'}
            </span>
            {trade.strategy_name && (
              <>
                <span className="text-tertiary text-xs">·</span>
                <span className="text-xs text-tertiary">{trade.strategy_name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {trade.status === 'open' && (
            <button
              onClick={() => setShowClose(true)}
              className="px-4 py-2 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors"
            >
              Cerrar trade
            </button>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-medium text-danger bg-loss-bg border border-loss/20 hover:opacity-80 rounded-lg transition-opacity"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* PnL destacado si está cerrado */}
      {trade.status === 'closed' && trade.pnl != null && (
        <div className={[
          'rounded-xl px-6 py-4 mb-6 border',
          pnlPos ? 'bg-profit/10 border-profit/20' : 'bg-loss/10 border-loss/20',
        ].join(' ')}>
          <p className="text-secondary text-xs uppercase tracking-wide mb-1">Resultado neto</p>
          <p className={['text-3xl font-bold', pnlPos ? 'text-profit' : 'text-loss'].join(' ')}>
            {pnlPos ? '+' : ''}{fmt(trade.pnl)}
          </p>
          <p className="text-tertiary text-xs mt-1">
            Bruto: {fmt(trade.gross_pnl)}
            {' · '}Swap: {fmt(trade.swap)}
            {' · '}Comisión: {fmt(trade.commission)}
            {' · '}Rollover: {fmt(trade.rollover)}
          </p>
        </div>
      )}

      {/* Campos del trade */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Field label="Cuenta" value={trade.account_name ?? `#${trade.account_id}`} />
        <Field
          label="Activo"
          value={trade.asset_name
            ? `${trade.asset_symbol} — ${trade.asset_name}`
            : (trade.asset_symbol ?? `#${trade.asset_id}`)}
        />
        <Field label="Estrategia" value={trade.strategy_name ?? <span className="text-dimmed">—</span>} />
        <Field label="Fecha entrada" value={formatDate(trade.entry_date)} />
        <Field label="Fecha salida" value={formatDate(trade.exit_date)} />
        <Field label="Tamaño (lotes)" value={String(trade.position_size)} />
        <Field label="Precio entrada" value={fmt(trade.entry_price, 5)} />
        <Field label="Precio salida" value={trade.exit_price != null ? fmt(trade.exit_price, 5) : <span className="text-dimmed">—</span>} />
        <Field
          label="PnL bruto"
          value={trade.gross_pnl != null
            ? <span className={trade.gross_pnl >= 0 ? 'text-profit' : 'text-loss'}>
              {trade.gross_pnl >= 0 ? '+' : ''}{fmt(trade.gross_pnl)}
            </span>
            : <span className="text-dimmed">—</span>}
        />
        {trade.stop_loss != null && (
          <Field label="Stop Loss" value={fmt(trade.stop_loss, 5)} />
        )}
        {trade.take_profit != null && (
          <Field label="Take Profit" value={fmt(trade.take_profit, 5)} />
        )}
      </div>

      {/* Notas */}
      {trade.comment && (
        <div className="mt-4 bg-surface border border-subtle rounded-xl px-4 py-3">
          <p className="text-tertiary text-xs uppercase tracking-wide font-medium mb-1">Notas</p>
          <p className="text-secondary text-sm whitespace-pre-wrap">{trade.comment}</p>
        </div>
      )}

      {/* Modal cerrar trade */}
      {showClose && (
        <CloseTradeModal
          trade={trade}
          onClose={() => setShowClose(false)}
          onClosed={(updated) => {
            setTrade(updated);
            setShowClose(false);
            toast('Trade cerrado correctamente');
          }}
        />
      )}

      {/* Confirmar eliminación */}
      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDelete(false); }}
        >
          <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-primary font-semibold text-base mb-2">Eliminar trade</h3>
            <p className="text-secondary text-sm mb-5">
              ¿Eliminar el trade de {trade.asset_symbol ?? `activo #${trade.asset_id}`} del{' '}
              {formatDate(trade.entry_date)}? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-base bg-danger-strong hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
