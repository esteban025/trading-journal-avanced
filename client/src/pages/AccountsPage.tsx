import { useEffect, useState } from 'react';
import { AccountForm } from '../components/AccountForm';
import { accountsService } from '../services/accountsService';
import { useAppContext, useToast } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import type { Account } from '../types';
import { PencilSquareIcon, TrashIcon, BanknotesIcon, PlusIcon } from '../assets/icons/icons-react';

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
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            title="Eliminar"
            className="p-1.5 text-tertiary hover:text-danger hover:bg-loss-bg rounded-md transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
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
        <BanknotesIcon className="w-8 h-8 text-dimmed" />
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
          <PlusIcon className="w-4 h-4" />
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

