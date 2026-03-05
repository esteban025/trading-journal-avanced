import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { useAppContext } from '../context/AppContext';

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
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
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
