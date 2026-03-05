import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { TradeFilters } from '../types';

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

// ── State ─────────────────────────────────────────────────────────────────────

interface AppState {
  activeAccountId: number | null;
  filters: TradeFilters;
  toasts: Toast[];
}

type AppAction =
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: number | null }
  | { type: 'SET_FILTERS'; payload: Partial<TradeFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: number };

const initialState: AppState = {
  activeAccountId: null,
  filters: { page: 1, limit: 20 },
  toasts: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_ACCOUNT':
      return {
        ...state,
        activeAccountId: action.payload,
        filters: {
          ...state.filters,
          account_id: action.payload ?? undefined,
          page: 1,
        },
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload, page: 1 },
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {
          page: 1,
          limit: state.filters.limit ?? 20,
          account_id: state.activeAccountId ?? undefined,
        },
      };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}

// ── useToast ──────────────────────────────────────────────────────────────────

export function useToast() {
  const { dispatch } = useAppContext();
  return useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      dispatch({ type: 'ADD_TOAST', payload: { id, message, variant } });
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
    },
    [dispatch],
  );
}
