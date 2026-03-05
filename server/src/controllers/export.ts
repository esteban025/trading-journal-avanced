import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import * as XLSX from 'xlsx';
import { db } from '../db';

function buildFilters(q: Record<string, string>): { where: string; params: unknown[] } {
  const { account_id, asset_id, strategy_id, direction, status, period } = q;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (account_id) { conditions.push('t.account_id = ?'); params.push(account_id); }
  if (asset_id) { conditions.push('t.asset_id = ?'); params.push(asset_id); }
  if (strategy_id) { conditions.push('t.strategy_id = ?'); params.push(strategy_id); }
  if (direction) { conditions.push('t.direction = ?'); params.push(direction); }
  if (status) { conditions.push('t.status = ?'); params.push(status); }

  if (period) {
    switch (period) {
      case 'day': conditions.push("DATE(t.entry_date) = CURDATE()"); break;
      case 'week': conditions.push("YEARWEEK(t.entry_date, 1) = YEARWEEK(NOW(), 1)"); break;
      case 'month': conditions.push("YEAR(t.entry_date) = YEAR(NOW()) AND MONTH(t.entry_date) = MONTH(NOW())"); break;
      case 'year': conditions.push("YEAR(t.entry_date) = YEAR(NOW())"); break;
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function fetchTrades(q: Record<string, string>): Promise<RowDataPacket[]> {
  const { where, params } = buildFilters(q);
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.id, ac.name AS account, a.symbol AS asset, a.type AS asset_type,
            s.name AS strategy, t.direction, t.status,
            t.entry_date, t.exit_date,
            t.entry_price, t.exit_price, t.position_size,
            t.stop_loss, t.take_profit,
            t.gross_pnl, t.swap, t.commission, t.rollover, t.pnl,
            t.comment
     FROM trades t
     JOIN accounts ac ON t.account_id = ac.id
     JOIN assets a    ON t.asset_id   = a.id
     LEFT JOIN strategies s ON t.strategy_id = s.id
     ${where}
     ORDER BY t.entry_date DESC`,
    params
  );
  return rows;
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const trades = await fetchTrades(req.query as Record<string, string>);
  if (!trades.length) {
    res.status(404).json({ error: 'No trades found for the given filters' });
    return;
  }

  const headers = Object.keys(trades[0]).join(',');
  const rowLines = trades.map((t) =>
    Object.values(t)
      .map((v) => `"${v ?? ''}"`)
      .join(',')
  );
  const csv = [headers, ...rowLines].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="trades.csv"');
  res.send(csv);
}

export async function exportExcel(req: Request, res: Response): Promise<void> {
  const trades = await fetchTrades(req.query as Record<string, string>);
  if (!trades.length) {
    res.status(404).json({ error: 'No trades found for the given filters' });
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(trades);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="trades.xlsx"');
  res.send(buffer);
}
