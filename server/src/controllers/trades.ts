import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db';

function periodClause(period: string | undefined, field = 'entry_date'): string {
  switch (period) {
    case 'day': return `AND DATE(${field}) = CURDATE()`;
    case 'week': return `AND YEARWEEK(${field}, 1) = YEARWEEK(NOW(), 1)`;
    case 'month': return `AND YEAR(${field}) = YEAR(NOW()) AND MONTH(${field}) = MONTH(NOW())`;
    case 'year': return `AND YEAR(${field}) = YEAR(NOW())`;
    default: return '';
  }
}

export async function getTrades(req: Request, res: Response): Promise<void> {
  const q = req.query as Record<string, string>;
  const { account_id, asset_id, strategy_id, direction, status, period, page = '1', limit = '20' } = q;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (account_id) { conditions.push('t.account_id = ?'); params.push(account_id); }
  if (asset_id) { conditions.push('t.asset_id = ?'); params.push(asset_id); }
  if (strategy_id) { conditions.push('t.strategy_id = ?'); params.push(strategy_id); }
  if (direction) { conditions.push('t.direction = ?'); params.push(direction); }
  if (status) { conditions.push('t.status = ?'); params.push(status); }

  const periodStr = periodClause(period);
  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')} ${periodStr}`
    : periodStr ? `WHERE 1=1 ${periodStr}` : '';

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.*,
            a.symbol AS asset_symbol, a.name AS asset_name,
            s.name   AS strategy_name,
            ac.name  AS account_name
     FROM trades t
     JOIN assets a    ON t.asset_id    = a.id
     JOIN accounts ac ON t.account_id  = ac.id
     LEFT JOIN strategies s ON t.strategy_id = s.id
     ${where}
     ORDER BY t.entry_date DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const countParams = [...params];
  const [[{ total }]] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM trades t ${where}`,
    countParams
  ) as [RowDataPacket[], unknown];

  res.json({ data: rows, total: Number(total), page: pageNum, limit: limitNum });
}

export async function getTradeById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.*, a.symbol AS asset_symbol, a.name AS asset_name, a.pip_value,
            s.name AS strategy_name, ac.name AS account_name
     FROM trades t
     JOIN assets a    ON t.asset_id   = a.id
     JOIN accounts ac ON t.account_id = ac.id
     LEFT JOIN strategies s ON t.strategy_id = s.id
     WHERE t.id = ?`,
    [id]
  );
  if (!rows.length) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  res.json(rows[0]);
}

export async function createTrade(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const {
    account_id, asset_id, strategy_id, direction,
    entry_date, exit_date,
    entry_price, exit_price,
    position_size,
    stop_loss, take_profit,
    swap = 0, commission = 0, rollover = 0,
    comment,
  } = body;

  if (!account_id || !asset_id || !direction || !entry_date || entry_price === undefined || position_size === undefined) {
    res.status(400).json({ error: 'account_id, asset_id, direction, entry_date, entry_price, position_size son requeridos' });
    return;
  }

  // Si se proporciona precio de salida, la fecha de salida también es obligatoria y viceversa
  if ((exit_price !== undefined && exit_price !== null) && !exit_date) {
    res.status(400).json({ error: 'exit_date es requerida cuando se proporciona exit_price' });
    return;
  }
  if (exit_date && (exit_price === undefined || exit_price === null)) {
    res.status(400).json({ error: 'exit_price es requerido cuando se proporciona exit_date' });
    return;
  }

  const isClosed = exit_price !== undefined && exit_price !== null && exit_date;

  let gross_pnl: number | null = null;
  let pnl_val: number | null = null;

  if (isClosed) {
    // Obtener pip_value del activo para el cálculo
    const [[asset]] = await db.query<RowDataPacket[]>(
      'SELECT pip_value FROM assets WHERE id = ?',
      [asset_id]
    ) as [RowDataPacket[], unknown];

    const pipValue = Number(asset?.pip_value) || 1;
    const priceDiff = direction === 'long'
      ? Number(exit_price) - Number(entry_price)
      : Number(entry_price) - Number(exit_price);

    gross_pnl = priceDiff * (Number(position_size) * 100) * pipValue;
    pnl_val = gross_pnl - Number(swap) - Number(commission) - Number(rollover);
  }

  const status = isClosed ? 'closed' : 'open';

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO trades
       (account_id, asset_id, strategy_id, direction,
        entry_date, exit_date,
        entry_price, exit_price,
        position_size, stop_loss, take_profit,
        swap, commission, rollover,
        gross_pnl, pnl,
        comment, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      account_id, asset_id, strategy_id ?? null, direction,
      entry_date, exit_date ?? null,
      entry_price, exit_price ?? null,
      position_size, stop_loss ?? null, take_profit ?? null,
      Number(swap), Number(commission), Number(rollover),
      gross_pnl, pnl_val,
      comment ?? null, status,
    ]
  );

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.*, a.symbol AS asset_symbol, a.name AS asset_name, a.pip_value,
            s.name AS strategy_name, ac.name AS account_name
     FROM trades t
     JOIN assets a    ON t.asset_id   = a.id
     JOIN accounts ac ON t.account_id = ac.id
     LEFT JOIN strategies s ON t.strategy_id = s.id
     WHERE t.id = ?`,
    [result.insertId]
  );
  res.status(201).json(rows[0]);
}

export async function updateTrade(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existingRows] = await db.query<RowDataPacket[]>(
    `SELECT t.*, a.pip_value FROM trades t JOIN assets a ON t.asset_id = a.id WHERE t.id = ?`,
    [id]
  );
  if (!(existingRows as RowDataPacket[]).length) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }

  const existing = (existingRows as RowDataPacket[])[0];
  const body = req.body as Record<string, unknown>;

  const allowed = [
    'account_id', 'asset_id', 'strategy_id', 'direction',
    'entry_date', 'exit_date',
    'entry_price', 'exit_price',
    'position_size', 'stop_loss', 'take_profit',
    'swap', 'commission', 'rollover',
    'comment',
  ];
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const field of allowed) {
    if (field in body) {
      updates.push(`${field} = ?`);
      params.push(body[field] ?? null);
    }
  }

  if (!updates.length) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  // Calcular valores finales para determinar PnL
  const mergedDirection = String(body.direction ?? existing['direction']);
  const mergedEntryPrice = Number(body.entry_price ?? existing['entry_price']);
  const mergedExitPrice = 'exit_price' in body
    ? (body.exit_price != null ? Number(body.exit_price) : null)
    : (existing['exit_price'] != null ? Number(existing['exit_price']) : null);
  const mergedExitDate = 'exit_date' in body ? body.exit_date : existing['exit_date'];
  const mergedPositionSize = Number(body.position_size ?? existing['position_size']);
  const mergedSwap = Number(body.swap ?? existing['swap'] ?? 0);
  const mergedCommission = Number(body.commission ?? existing['commission'] ?? 0);
  const mergedRollover = Number(body.rollover ?? existing['rollover'] ?? 0);

  // Si cambia el activo, obtener el nuevo pip_value
  let pipValue = Number(existing['pip_value']) || 1;
  if (body.asset_id && Number(body.asset_id) !== Number(existing['asset_id'])) {
    const [[newAsset]] = await db.query<RowDataPacket[]>(
      'SELECT pip_value FROM assets WHERE id = ?', [body.asset_id]
    ) as [RowDataPacket[], unknown];
    if (newAsset) pipValue = Number(newAsset['pip_value']) || 1;
  }

  let gross_pnl: number | null = null;
  let pnl_val: number | null = null;
  let status = 'open';

  if (mergedExitPrice !== null && mergedExitDate) {
    const priceDiff = mergedDirection === 'long'
      ? mergedExitPrice - mergedEntryPrice
      : mergedEntryPrice - mergedExitPrice;
    gross_pnl = priceDiff * (mergedPositionSize * 100) * pipValue;
    pnl_val = gross_pnl - mergedSwap - mergedCommission - mergedRollover;
    status = 'closed';
  }

  updates.push('gross_pnl = ?', 'pnl = ?', 'status = ?');
  params.push(gross_pnl, pnl_val, status, id);

  await db.query(`UPDATE trades SET ${updates.join(', ')} WHERE id = ?`, params);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.*, a.symbol AS asset_symbol, a.name AS asset_name, a.pip_value,
            s.name AS strategy_name, ac.name AS account_name
     FROM trades t
     JOIN assets a    ON t.asset_id   = a.id
     JOIN accounts ac ON t.account_id = ac.id
     LEFT JOIN strategies s ON t.strategy_id = s.id
     WHERE t.id = ?`,
    [id]
  );
  res.json(rows[0]);
}

export async function closeTrade(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>(
    `SELECT t.*, a.pip_value
     FROM trades t
     JOIN assets a ON t.asset_id = a.id
     WHERE t.id = ?`,
    [id]
  );

  if (!existing.length) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }

  const trade = existing[0];
  if (trade['status'] === 'closed') {
    res.status(400).json({ error: 'Trade is already closed' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const { exit_price, exit_date, swap = 0, commission = 0, rollover = 0 } = body;

  if (exit_price === undefined || !exit_date) {
    res.status(400).json({ error: 'exit_price and exit_date are required' });
    return;
  }

  // Fórmula PnL según la dirección del trade
  // Long:  (exit_price - entry_price) * (position_size * 100) * pip_value
  // Short: (entry_price - exit_price) * (position_size * 100) * pip_value
  const pipValue = Number(trade['pip_value']) || 1;
  const priceDiff = trade['direction'] === 'long'
    ? Number(exit_price) - Number(trade['entry_price'])
    : Number(trade['entry_price']) - Number(exit_price);
  const gross_pnl = priceDiff * (Number(trade['position_size']) * 100) * pipValue;
  const pnl = gross_pnl - Number(swap) - Number(commission) - Number(rollover);

  await db.query(
    `UPDATE trades
     SET exit_price = ?, exit_date = ?, swap = ?, commission = ?, rollover = ?,
         gross_pnl = ?, pnl = ?, status = 'closed'
     WHERE id = ?`,
    [exit_price, exit_date, swap, commission, rollover, gross_pnl, pnl, id]
  );

  // Retornamos con JOIN para que el frontend tenga asset_symbol, strategy_name, etc.
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.*, a.symbol AS asset_symbol, a.name AS asset_name, a.pip_value,
            s.name AS strategy_name, ac.name AS account_name
     FROM trades t
     JOIN assets a    ON t.asset_id   = a.id
     JOIN accounts ac ON t.account_id = ac.id
     LEFT JOIN strategies s ON t.strategy_id = s.id
     WHERE t.id = ?`,
    [id]
  );
  res.json(rows[0]);
}

export async function deleteTrade(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM trades WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  await db.query('DELETE FROM trades WHERE id = ?', [id]);
  res.status(204).send();
}
