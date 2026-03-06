import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { useAppContext } from '../context/AppContext';
import { CheckIcon, ExclamationCircleIcon, XMarkIcon } from '../assets/icons/icons-react';

function ToastContainer() {
  const { state, dispatch } = useAppContext();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium pointer-events-auto',
            'animate-[toastIn_0.25s_ease-out]',
            toast.variant === 'success'
              ? 'bg-surface border-profit/30 text-profit'
              : 'bg-surface border-loss/30 text-loss',
          ].join(' ')}
        >
          {toast.variant === 'success' ? (
            <CheckIcon className="w-4 h-4 shrink-0" />
          ) : (
            <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <XMarkIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-base text-primary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
