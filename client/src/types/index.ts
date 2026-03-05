export type AssetType = 'forex' | 'index' | 'stocks' | 'futures' | 'crypto' | 'commodities';
export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';
export type Period = 'day' | 'week' | 'month' | 'year';

export interface Account {
  id: number;
  name: string;
  currency: string;
  initial_balance: number;
  total_pnl: number;
  current_balance: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: number;
  symbol: string;
  name: string | null;
  type: AssetType;
  pip_value: number | null;
  created_at: string;
}

export interface Strategy {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Trade {
  id: number;
  account_id: number;
  asset_id: number;
  strategy_id: number | null;
  direction: TradeDirection;
  entry_date: string;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  position_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  gross_pnl: number | null;
  swap: number;
  commission: number;
  rollover: number;
  pnl: number | null;
  status: TradeStatus;
  comment: string | null;
  // Joined fields
  asset_symbol?: string;
  asset_name?: string | null;
  pip_value?: number | null;
  strategy_name?: string | null;
  account_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TradeFilters {
  account_id?: number;
  asset_id?: number;
  strategy_id?: number;
  direction?: TradeDirection;
  status?: TradeStatus;
  period?: Period;
  page?: number;
  limit?: number;
}

export interface PaginatedTrades {
  data: Trade[];
  total: number;
  page: number;
  limit: number;
}

export interface CloseTradePayload {
  exit_price: number;
  exit_date: string;
  swap?: number;
  commission?: number;
  rollover?: number;
}

export interface MetricsSummary {
  account_id: number;
  account_name: string;
  total_closed_trades: number;
  win_rate: number | null;
  avg_win: number | null;
  avg_loss: number | null;
  avg_win_loss_ratio: number | null;
  total_wins: number;
  total_losses: number;
  net_pnl: number | null;
  profit_factor: number | null;
}

export interface EquityPoint {
  exit_date: string;
  pnl: number;
  cumulative_pnl: number;
}

export interface AssetMetrics {
  id: number;
  symbol: string;
  name: string | null;
  type: string;
  total_trades: number;
  total_pnl: number;
  win_rate: number;
}

export interface StrategyMetrics {
  id: number;
  name: string;
  total_trades: number;
  total_pnl: number;
  win_rate: number;
}
