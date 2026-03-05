import { useEffect, useState } from 'react';
import type { Strategy } from '../types';
import { strategiesService } from '../services/strategiesService';
import { StrategyForm } from '../components/StrategyForm';

// ── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  strategyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ strategyName, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-primary font-semibold text-base mb-2">Eliminar estrategia</h3>
        <p className="text-secondary text-sm mb-5">
          ¿Estás seguro de que deseas eliminar{' '}
          <span className="text-primary font-medium">{strategyName}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-base bg-danger-strong hover:opacity-90 rounded-lg transition-opacity"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.364 2.798H4.16c-1.393 0-2.364-1.798-1.364-2.798L4.2 15.3"
          />
        </svg>
      </div>
      <p className="text-primary font-medium mb-1">Sin estrategias registradas</p>
      <p className="text-secondary text-sm mb-5">
        Define las estrategias que utilizas en tus operaciones
      </p>
      <button
        onClick={onNew}
        className="px-4 py-2 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors"
      >
        + Nueva estrategia
      </button>
    </div>
  );
}

// ── StrategiesPage ────────────────────────────────────────────────────────────

export function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editStrategy, setEditStrategy] = useState<Strategy | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Strategy | null>(null);
  const [deleteError, setDeleteError] = useState('');

  async function loadStrategies() {
    try {
      const data = await strategiesService.list();
      setStrategies(data);
    } catch {
      setError('No se pudieron cargar las estrategias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStrategies(); }, []);

  function handleSaved(saved: Strategy) {
    setStrategies((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setShowForm(false);
    setEditStrategy(undefined);
  }

  function openEdit(strategy: Strategy) {
    setEditStrategy(strategy);
    setShowForm(true);
  }

  function openNew() {
    setEditStrategy(undefined);
    setShowForm(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError('');
    try {
      await strategiesService.delete(deleteTarget.id);
      setStrategies((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar');
      setDeleteTarget(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-0.5">Estrategias</h1>
          <p className="text-secondary text-sm">
            Catálogo de estrategias de trading
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors"
        >
          + Nueva estrategia
        </button>
      </div>

      {/* Error persistente */}
      {deleteError && (
        <div className="mb-4 text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError('')}
            className="text-tertiary hover:text-primary ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error de carga */}
      {error && (
        <div className="text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="bg-surface border border-subtle rounded-xl overflow-hidden animate-pulse">
          <div className="h-10 bg-elevated border-b border-subtle" />
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 border-b border-subtle last:border-0 px-4 flex items-center gap-4"
            >
              <div className="h-4 w-36 bg-elevated rounded" />
              <div className="h-4 w-64 bg-elevated rounded" />
              <div className="h-4 w-20 bg-elevated rounded ml-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && strategies.length > 0 && (
        <div className="bg-surface border border-subtle rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-elevated border-b border-subtle">
                <th className="px-4 py-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wide">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-tertiary uppercase tracking-wide">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy) => (
                <tr
                  key={strategy.id}
                  className="border-b border-subtle last:border-0 hover:bg-elevated/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-primary whitespace-nowrap">
                    {strategy.name}
                  </td>
                  <td className="px-4 py-3 text-secondary max-w-sm truncate">
                    {strategy.description ?? (
                      <span className="text-dimmed">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(strategy)}
                        className="text-xs text-secondary hover:text-primary bg-elevated hover:bg-overlay border border-muted rounded-md px-2.5 py-1 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(strategy);
                        }}
                        className="text-xs text-danger hover:opacity-80 bg-loss-bg border border-loss/20 rounded-md px-2.5 py-1 transition-opacity"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && strategies.length === 0 && (
        <EmptyState onNew={openNew} />
      )}

      {/* Modal formulario */}
      {showForm && (
        <StrategyForm
          strategy={editStrategy}
          onClose={() => {
            setShowForm(false);
            setEditStrategy(undefined);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal confirmación de borrado */}
      {deleteTarget && (
        <ConfirmDialog
          strategyName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
