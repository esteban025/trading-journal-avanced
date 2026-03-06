import { NavLink, useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { useEffect, useState } from 'react';
import { accountsService } from '../services/accountsService';
import type { Account } from '../types';
import {
  ChartBarIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  CircleStackIcon,
  Bars3BottomLeftIcon,
  PresentationChartBarIcon,
  PlusIcon,
} from '../assets/icons/icons-react';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: <ChartBarIcon className="w-5 h-5" />,
  },
  {
    to: '/trades',
    label: 'Trades',
    icon: <ArrowsRightLeftIcon className="w-5 h-5" />,
  },
  {
    to: '/accounts',
    label: 'Cuentas',
    icon: <BanknotesIcon className="w-5 h-5" />,
  },
  {
    to: '/assets',
    label: 'Activos',
    icon: <CircleStackIcon className="w-5 h-5" />,
  },
  {
    to: '/strategies',
    label: 'Estrategias',
    icon: <Bars3BottomLeftIcon className="w-5 h-5" />,
  },
  {
    to: '/reports',
    label: 'Reportes',
    icon: <PresentationChartBarIcon className="w-5 h-5" />,
  },
];

export function Sidebar() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    accountsService.list().then(setAccounts).catch(() => { });
  }, []);

  function handleAccountChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: val ? Number(val) : null });
  }

  return (
    <aside className="w-64 min-h-screen bg-surface border-r border-subtle flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-brand text-4xl font-bold">◈</span>
          <div>
            <p className="text-primary font-semibold text-lg leading-tight">Trading Journal</p>
            <p className="text-tertiary text-sm">Portfolio tracker</p>
          </div>
        </div>
      </div>

      {/* Account selector */}
      <div className="px-4 py-3 border-b border-subtle">
        <label className="block text-xs text-tertiary mb-2 font-medium uppercase tracking-wide">
          Cuenta activa
        </label>
        <select
          value={state.activeAccountId ?? ''}
          onChange={handleAccountChange}
          className="space-y-2 mb-2 w-full"
        >
          <option value="">Todas las cuentas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-subtle text-brand'
                  : 'text-secondary hover:bg-elevated hover:text-primary',
              ].join(' ')
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* New Trade button */}
        <div className="pt-3">
          <button
            onClick={() => navigate('/trades/new')}
            className="btn-cta w-full flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo Trade
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-subtle">
        <p className="text-xs text-dimmed text-center">v1.0.0</p>
      </div>
    </aside>
  );
}
