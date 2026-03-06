import { useEffect, useState } from 'react';
import type { Asset, AssetType } from '../types';
import { assetsService } from '../services/assetsService';
import { AssetForm } from '../components/AssetForm';
import { useToast } from '../context/AppContext';
import { usePageAnimation } from '../hooks/usePageAnimation';
import { ChartBarIcon } from '../assets/icons/icons-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<AssetType, string> = {
  forex: 'Forex',
  index: 'Índice',
  stocks: 'Acciones',
  futures: 'Futuros',
  crypto: 'Crypto',
  commodities: 'Commodities',
};

const TYPE_COLORS: Record<AssetType, string> = {
  forex: 'text-brand bg-brand-subtle border-brand/20',
  index: 'text-neutral bg-neutral-bg border-neutral/20',
  stocks: 'text-profit bg-profit-bg border-profit/20',
  futures: 'text-secondary bg-elevated border-muted',
  crypto: 'text-loss bg-loss-bg border-loss/20',
  commodities: 'text-dimmed bg-base border-subtle',
};

// ── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  assetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ assetName, onConfirm, onCancel }: ConfirmDialogProps) {
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
        <h3 className="text-primary font-semibold mb-2">Eliminar activo</h3>
        <p className="text-secondary text-sm mb-5">
          ¿Estás seguro de que deseas eliminar <span className="text-primary font-medium">{assetName}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-cancel">Cancelar</button>
          <button onClick={onConfirm} className="btn-danger">Eliminar</button>
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
        <ChartBarIcon className="w-7 h-7 text-tertiary" />
      </div>
      <p className="text-primary font-medium mb-1">Sin activos registrados</p>
      <p className="text-secondary text-sm mb-5">Agrega los instrumentos que operarás</p>
      <button onClick={onNew} className="btn-cta">+ Nuevo activo</button>
    </div>
  );
}

// ── AssetsPage ───────────────────────────────────────────────────────────────

export function AssetsPage() {
  const toast = useToast();
  const pageRef = usePageAnimation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  async function loadAssets() {
    try {
      const data = await assetsService.list();
      setAssets(data);
    } catch {
      setError('No se pudieron cargar los activos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAssets(); }, []);

  function handleSaved(saved: Asset) {
    setAssets((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setShowForm(false);
    setEditAsset(undefined);
    toast(editAsset ? 'Activo actualizado' : 'Activo creado');
  }

  function openEdit(asset: Asset) {
    setEditAsset(asset);
    setShowForm(true);
  }

  function openNew() {
    setEditAsset(undefined);
    setShowForm(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await assetsService.delete(deleteTarget.id);
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Activo eliminado');
    } catch (err) {
      setDeleteTarget(null);
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
  }

  return (
    <div ref={pageRef} className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-0.5">Activos</h1>
          <p className="text-secondary text-sm">Catálogo de instrumentos operados</p>
        </div>
        <button onClick={openNew} className="btn-cta">+ Nuevo activo</button>
      </div>

      {/* Error persistente */}
      {error && (
        <div className="mb-4 text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-tertiary hover:text-primary ml-4">✕</button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="bg-surface border border-subtle rounded-xl overflow-hidden animate-pulse">
          <div className="h-10 bg-elevated border-b border-subtle" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-b border-subtle last:border-0 px-4 flex items-center gap-4">
              <div className="h-4 w-20 bg-elevated rounded" />
              <div className="h-4 w-32 bg-elevated rounded" />
              <div className="h-5 w-16 bg-elevated rounded-full" />
              <div className="h-4 w-12 bg-elevated rounded ml-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && assets.length > 0 && (
        <div className="container-table">
          <table>
            <thead>
              <tr>
                <th>Símbolo</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Pip Value</th>
                <th className="min">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, i) => (
                <tr
                  key={asset.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className=""
                >
                  <td className=" font-semibold text-primary">{asset.symbol}</td>
                  <td className=" text-secondary">{asset.name ?? <span className="text-dimmed">—</span>}</td>
                  <td className="flex justify-center">
                    <span className={['text-xs font-medium px-2.5 py-1 rounded-full border', TYPE_COLORS[asset.type]].join(' ')}>
                      {TYPE_LABELS[asset.type]}
                    </span>
                  </td>
                  <td className=" text-center text-secondary">
                    {asset.pip_value != null ? asset.pip_value : <span className="text-dimmed">—</span>}
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => openEdit(asset)} className="btn-act edit">Editar</button>
                      <button onClick={() => { setDeleteTarget(asset); }} className="btn-act btn-act-delete">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && assets.length === 0 && <EmptyState onNew={openNew} />}

      {/* Modal formulario */}
      {showForm && (
        <AssetForm
          asset={editAsset}
          onClose={() => { setShowForm(false); setEditAsset(undefined); }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal confirmación de borrado */}
      {deleteTarget && (
        <ConfirmDialog
          assetName={deleteTarget.symbol}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
