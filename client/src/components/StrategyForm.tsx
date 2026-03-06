import { useEffect, useState } from 'react';
import type { Strategy } from '../types';
import { strategiesService } from '../services/strategiesService';
import { XMarkIcon } from '../assets/icons/icons-react';

interface StrategyFormProps {
  strategy?: Strategy;
  onClose: () => void;
  onSaved: (strategy: Strategy) => void;
}

interface FormData {
  name: string;
  description: string;
}

export function StrategyForm({ strategy, onClose, onSaved }: StrategyFormProps) {
  const isEdit = !!strategy;
  const [form, setForm] = useState<FormData>({
    name: strategy?.name ?? '',
    description: strategy?.description ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      };
      const saved = isEdit
        ? await strategiesService.update(strategy.id, payload)
        : await strategiesService.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-primary font-semibold text-lg">
            {isEdit ? 'Editar estrategia' : 'Nueva estrategia'}
          </h2>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-primary transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Nombre *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Breakout, Scalping, SMC"
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-tertiary uppercase tracking-wide mb-1">
              Descripción{' '}
              <span className="text-dimmed normal-case">(opcional)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe brevemente la lógica de entrada y salida..."
              rows={4}
              className="w-full bg-elevated border border-muted text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-dimmed resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-danger text-sm bg-loss-bg border border-loss/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-secondary bg-elevated border border-muted rounded-lg hover:text-primary hover:border-subtle transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-base bg-brand-strong hover:bg-brand rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Guardando...'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Crear estrategia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
