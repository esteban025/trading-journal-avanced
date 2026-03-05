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
  const { account_id } = req.query as Record<string, string>;
  const params: unknown[] = [];
  let query = 'SELECT * FROM trade_metrics';
  if (account_id) {
    query += ' WHERE account_id = ?';
    params.push(account_id);
  }
  const [rows] = await db.query<RowDataPacket[]>(query, params);
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
