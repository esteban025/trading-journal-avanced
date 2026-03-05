export type AssetType = 'forex' | 'index' | 'stocks' | 'futures' | 'crypto' | 'commodities';
export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';

export interface Account {
  id: number;
  name: string;
  currency: string;
  initial_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface AccountBalance extends Account {
  total_pnl: number;
  current_balance: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
}

export interface Asset {
  id: number;
  symbol: string;
  name: string | null;
  type: AssetType;
  pip_value: number | null;
  created_at: Date;
}

export interface Strategy {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
}

export interface Trade {
  id: number;
  account_id: number;
  asset_id: number;
  strategy_id: number | null;
  direction: TradeDirection;
  entry_date: Date;
  exit_date: Date | null;
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
  created_at: Date;
  updated_at: Date;
}
