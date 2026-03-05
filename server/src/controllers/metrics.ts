import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { db } from '../db';

function periodClause(period: string | undefined, field = 'exit_date'): string {
  switch (period) {
    case 'day': return `AND DATE(${field}) = CURDATE()`;
    case 'week': return `AND YEARWEEK(${field}, 1) = YEARWEEK(NOW(), 1)`;
    case 'month': return `AND YEAR(${field}) = YEAR(NOW()) AND MONTH(${field}) = MONTH(NOW())`;
    case 'year': return `AND YEAR(${field}) = YEAR(NOW())`;
    default: return '';
  }
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  const { account_id, period } = req.query as Record<string, string>;

  // Condición de período en la cláusula ON del LEFT JOIN (así cuentas sin trades en el período siguen apareciendo con ceros)
  let periodOnClause = '';
  if (period) {
    switch (period) {
      case 'day': periodOnClause = 'AND DATE(t.exit_date) = CURDATE()'; break;
      case 'week': periodOnClause = 'AND YEARWEEK(t.exit_date, 1) = YEARWEEK(NOW(), 1)'; break;
      case 'month': periodOnClause = 'AND YEAR(t.exit_date) = YEAR(NOW()) AND MONTH(t.exit_date) = MONTH(NOW())'; break;
      case 'year': periodOnClause = 'AND YEAR(t.exit_date) = YEAR(NOW())'; break;
    }
  }

  const whereClause = account_id ? 'WHERE a.id = ?' : '';
  const params: unknown[] = account_id ? [account_id] : [];

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       a.id AS account_id,
       a.name AS account_name,
       COUNT(t.id) AS total_closed_trades,
       ROUND(
         COUNT(CASE WHEN t.pnl > 0 THEN 1 END) * 100.0 /
         NULLIF(COUNT(t.id), 0),
       2) AS win_rate,
       ROUND(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END), 2) AS avg_win,
       ROUND(AVG(CASE WHEN t.pnl < 0 THEN t.pnl END), 2) AS avg_loss,
       ROUND(
         ABS(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END)) /
         NULLIF(ABS(AVG(CASE WHEN t.pnl < 0 THEN t.pnl END)), 0),
       2) AS avg_win_loss_ratio,
       ROUND(COALESCE(SUM(CASE WHEN t.pnl > 0 THEN t.pnl ELSE 0 END), 0), 2) AS total_wins,
       ROUND(COALESCE(SUM(CASE WHEN t.pnl < 0 THEN t.pnl ELSE 0 END), 0), 2) AS total_losses,
       ROUND(COALESCE(SUM(t.pnl), 0), 2) AS net_pnl,
       ROUND(
         COALESCE(ABS(SUM(CASE WHEN t.pnl > 0 THEN t.pnl ELSE 0 END)), 0) /
         NULLIF(ABS(COALESCE(SUM(CASE WHEN t.pnl < 0 THEN t.pnl ELSE 0 END), 0)), 0),
       2) AS profit_factor
     FROM accounts a
     LEFT JOIN trades t ON a.id = t.account_id
       AND t.status = 'closed'
       AND t.exit_date IS NOT NULL
       ${periodOnClause}
     ${whereClause}
     GROUP BY a.id, a.name`,
    params
  );
  res.json(rows);
}

export async function getEquityCurve(req: Request, res: Response): Promise<void> {
  const { account_id, period } = req.query as Record<string, string>;

  const conditions: string[] = ["status = 'closed'", 'exit_date IS NOT NULL'];
  const params: unknown[] = [];

  if (account_id) { conditions.push('account_id = ?'); params.push(account_id); }

  const where = `WHERE ${conditions.join(' AND ')} ${periodClause(period)}`;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT exit_date, pnl FROM trades ${where} ORDER BY exit_date ASC`,
    params
  );

  let cumulative = 0;
  const curve = rows.map((row) => {
    cumulative += Number(row['pnl']) || 0;
    return {
      exit_date: row['exit_date'],
      pnl: Number(row['pnl']),
      cumulative_pnl: Math.round(cumulative * 100) / 100,
    };
  });

  res.json(curve);
}

export async function getByAsset(req: Request, res: Response): Promise<void> {
  const { account_id, period } = req.query as Record<string, string>;

  const conditions: string[] = ["t.status = 'closed'"];
  const params: unknown[] = [];

  if (account_id) { conditions.push('t.account_id = ?'); params.push(account_id); }

  const where = `WHERE ${conditions.join(' AND ')} ${periodClause(period, 't.exit_date')}`;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       a.id, a.symbol, a.name, a.type,
       COUNT(*) AS total_trades,
       ROUND(SUM(t.pnl), 2) AS total_pnl,
       ROUND(COUNT(CASE WHEN t.pnl > 0 THEN 1 END) * 100.0 / COUNT(*), 2) AS win_rate
     FROM trades t
     JOIN assets a ON t.asset_id = a.id
     ${where}
     GROUP BY a.id, a.symbol, a.name, a.type
     ORDER BY total_pnl DESC`,
    params
  );

  res.json(rows);
}

export async function getByStrategy(req: Request, res: Response): Promise<void> {
  const { account_id, period } = req.query as Record<string, string>;

  const conditions: string[] = ["t.status = 'closed'", 't.strategy_id IS NOT NULL'];
  const params: unknown[] = [];

  if (account_id) { conditions.push('t.account_id = ?'); params.push(account_id); }

  const where = `WHERE ${conditions.join(' AND ')} ${periodClause(period, 't.exit_date')}`;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       s.id, s.name,
       COUNT(*) AS total_trades,
       ROUND(SUM(t.pnl), 2) AS total_pnl,
       ROUND(COUNT(CASE WHEN t.pnl > 0 THEN 1 END) * 100.0 / COUNT(*), 2) AS win_rate
     FROM trades t
     JOIN strategies s ON t.strategy_id = s.id
     ${where}
     GROUP BY s.id, s.name
     ORDER BY total_pnl DESC`,
    params
  );

  res.json(rows);
}
