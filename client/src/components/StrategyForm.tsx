import { useEffect, useState } from 'react';
import type { Strategy } from '../types';
import { strategiesService } from '../services/strategiesService';
import { XMarkIcon } from '../assets/icons/icons-react';
import { useModalAnimation } from '../hooks/useModalAnimation';

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
  const boxRef = useModalAnimation();
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
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={boxRef} className="modal-box max-w-md">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-primary font-semibold text-lg">
            {isEdit ? 'Editar estrategia' : 'Nueva estrategia'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nombre */}
          <div>
            <label className="form-label">Nombre *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Breakout, Scalping, SMC"
              className="form-input"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="form-label">
              Descripción{' '}
              <span className="text-dimmed normal-case">(opcional)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe brevemente la lógica de entrada y salida..."
              rows={4}
              className="form-input resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
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
