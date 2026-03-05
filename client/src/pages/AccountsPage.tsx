import { useEffect, useState } from 'react';
import { AccountForm } from '../components/AccountForm';
import { accountsService } from '../services/accountsService';
import { useAppContext, useToast } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import type { Account } from '../types';

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function AccountCard({
  account,
  isActive,
  onSetActive,
  onEdit,
  onDelete,
}: {
  account: Account;
  isActive: boolean;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pnlPositive = account.total_pnl >= 0;
  const winRate =
    account.total_trades > 0
      ? Math.round((account.winning_trades / account.total_trades) * 100)
      : null;

  return (
    <div
      className={[
        'bg-surface border rounded-xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-lg',
        isActive ? 'border-brand shadow-brand/10 shadow-md' : 'border-subtle',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={[
            'w-2 h-2 rounded-full shrink-0 mt-1',
            isActive ? 'bg-brand' : 'bg-dimmed',
          ].join(' ')} />
          <div className="min-w-0">
            <h3 className="text-primary font-semibold text-sm truncate">{account.name}</h3>
            <span className="text-tertiary text-xs">{account.currency}</span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            title="Editar"
            className="p-1.5 text-tertiary hover:text-primary hover:bg-elevated rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            title="Eliminar"
            className="p-1.5 text-tertiary hover:text-danger hover:bg-loss-bg rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-elevated rounded-lg px-3 py-2">
          <p className="text-tertiary text-xs mb-0.5">Balance inicial</p>
          <p className="text-primary text-sm font-medium">
            {formatCurrency(account.initial_balance, account.currency)}
          </p>
        </div>
        <div className="bg-elevated rounded-lg px-3 py-2">
          <p className="text-tertiary text-xs mb-0.5">Balance actual</p>
          <p className="text-primary text-sm font-medium">
            {formatCurrency(account.current_balance, account.currency)}
          </p>
        </div>
      </div>

      {/* PnL + stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-tertiary text-xs mb-0.5">PnL neto</p>
          <p className={['text-sm font-semibold', pnlPositive ? 'text-profit' : 'text-loss'].join(' ')}>
            {pnlPositive ? '+' : ''}{formatCurrency(account.total_pnl, account.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-tertiary text-xs mb-0.5">Trades cerrados</p>
          <p className="text-primary text-sm font-medium">{account.total_trades}</p>
        </div>
        {winRate !== null && (
          <div className="text-right">
            <p className="text-tertiary text-xs mb-0.5">Win rate</p>
            <p className={['text-sm font-medium', winRate >= 50 ? 'text-profit' : 'text-loss'].join(' ')}>
              {winRate}%
            </p>
          </div>
        )}
      </div>

      {/* Set active button */}
      <button
        onClick={onSetActive}
        className={[
          'w-full py-1.5 text-xs font-medium rounded-lg border transition-colors',
          isActive
            ? 'border-brand/40 text-brand bg-brand-subtle cursor-default'
            : 'border-muted text-secondary hover:border-brand hover:text-brand hover:bg-brand-subtle',
        ].join(' ')}
      >
        {isActive ? '✓ Cuenta activa' : 'Seleccionar como activa'}
      </button>
    </div>
  );
}

/* ─── Confirm dialog ─────────────────────────────────────────── */
function ConfirmDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-primary font-semibold text-base mb-2">Eliminar cuenta</h2>
        <p className="text-secondary text-sm mb-5">
          ¿Estás seguro de que deseas eliminar <span className="text-primary font-medium">"{name}"</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-muted text-secondary hover:text-primary hover:bg-elevated transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-danger-strong hover:bg-danger text-white transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-dimmed" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
        </svg>
      </div>
      <p className="text-secondary font-medium mb-1">Sin cuentas todavía</p>
      <p className="text-tertiary text-sm mb-5">Crea tu primera cuenta de trading para empezar</p>
      <button
        onClick={onNew}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-strong hover:bg-brand text-base transition-colors"
      >
        + Nueva cuenta
      </button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export function AccountsPage() {
  const { state, dispatch } = useAppContext();
  const toast = useToast();
  const pageRef = usePageAnimation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Account | undefined>();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await accountsService.list();
      setAccounts(data);
    } catch {
      setError('No se pudieron cargar las cuentas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditTarget(undefined);
    setShowForm(true);
  }

  function openEdit(account: Account) {
    setEditTarget(account);
    setShowForm(true);
  }

  function handleSaved(saved: Account) {
    setShowForm(false);
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    toast(editTarget ? 'Cuenta actualizada' : 'Cuenta creada');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await accountsService.delete(deleteTarget.id);
      setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (state.activeAccountId === deleteTarget.id) {
        dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: null });
      }
      setDeleteTarget(undefined);
      toast('Cuenta eliminada');
    } catch (err) {
      setDeleteTarget(undefined);
      toast(err instanceof Error ? err.message : 'No se pudo eliminar la cuenta', 'error');
    }
  }

  return (
    <div ref={pageRef} className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Cuentas</h1>
          <p className="text-secondary text-sm mt-0.5">
            {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} registrada{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-strong hover:bg-brand text-base transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva cuenta
        </button>
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-subtle rounded-xl p-5 h-52 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-danger bg-loss-bg border border-danger/20 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <EmptyState onNew={openNew} />
      )}

      {!loading && !error && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              isActive={state.activeAccountId === account.id}
              onSetActive={() =>
                dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: account.id })
              }
              onEdit={() => openEdit(account)}
              onDelete={() => setDeleteTarget(account)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <AccountForm
          account={editTarget}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(undefined)}
        />
      )}
    </div>
  );
}

