import { useEffect, useState } from 'react';
import type { Strategy } from '../types';
import { strategiesService } from '../services/strategiesService';
import { StrategyForm } from '../components/StrategyForm';
import { useToast } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import { BeakerIcon, EditIcon, PlusIcon, TrashIcon } from '../assets/icons/icons-react';

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
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="confirm-box">
        <h3 className="text-primary font-semibold mb-2">Eliminar estrategia</h3>
        <p className="text-secondary text-sm mb-5">
          ¿Estás seguro de que deseas eliminar{' '}
          <span className="text-primary font-medium">{strategyName}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="btn btn-secondary w-full">Cancelar</button>
          <button onClick={onConfirm} className="btn btn-primary w-full">Eliminar</button>
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
        <BeakerIcon className="w-7 h-7 text-tertiary" />
      </div>
      <p className="text-primary font-medium mb-1">Sin estrategias registradas</p>
      <p className="text-secondary text-sm mb-5">
        Define las estrategias que utilizas en tus operaciones
      </p>
      <button onClick={onNew} className="btn btn-primary w-full">+ Nueva estrategia</button>
    </div>
  );
}

// ── StrategiesPage ────────────────────────────────────────────────────────────

export function StrategiesPage() {
  const toast = useToast();
  const pageRef = usePageAnimation();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editStrategy, setEditStrategy] = useState<Strategy | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Strategy | null>(null);

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
    toast(editStrategy ? 'Estrategia actualizada' : 'Estrategia creada');
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
    try {
      await strategiesService.delete(deleteTarget.id);
      setStrategies((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Estrategia eliminada');
    } catch (err) {
      setDeleteTarget(null);
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  }

  return (
    <div ref={pageRef} className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-0.5">Estrategias</h1>
          <p className="text-secondary text-sm">
            Catálogo de estrategias de trading
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary">
          <PlusIcon />
          Nueva estrategia
        </button>
      </div>

      {/* Error de carga */}
      {error && (
        <div className="form-error mb-4">{error}</div>
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
        <div className="container-table">
          <table>
            <thead>
              <tr>
                <th>
                  Nombre
                </th>
                <th>
                  Descripción
                </th>
                <th className="min">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy, i) => (
                <tr
                  key={strategy.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="row-enter"
                >
                  <td>
                    {strategy.name}
                  </td>
                  <td className='text-secondary'>
                    {strategy.description ?? (
                      <span className="text-dimmed">—</span>
                    )}
                  </td>
                  <td className="">
                    <div className="actions">
                      <button onClick={() => openEdit(strategy)} className="btn-act edit">
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(strategy);
                        }}
                        className="btn-act delete"
                      >
                        <TrashIcon />
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
