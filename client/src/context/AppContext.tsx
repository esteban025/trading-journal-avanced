import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { TradeFilters } from '../types';

interface AppState {
  activeAccountId: number | null;
  filters: TradeFilters;
}

type AppAction =
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: number | null }
  | { type: 'SET_FILTERS'; payload: Partial<TradeFilters> }
  | { type: 'RESET_FILTERS' };

const initialState: AppState = {
  activeAccountId: null,
  filters: { page: 1, limit: 20 },
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
