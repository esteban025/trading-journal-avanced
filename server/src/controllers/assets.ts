import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db';

export async function getAssets(_req: Request, res: Response): Promise<void> {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM assets ORDER BY symbol');
  res.json(rows);
}

export async function getAssetById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM assets WHERE id = ?', [id]);
  if (!rows.length) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  res.json(rows[0]);
}

export async function createAsset(req: Request, res: Response): Promise<void> {
  const { symbol, name, type, pip_value } = req.body as Record<string, unknown>;
  if (!symbol || !type) {
    res.status(400).json({ error: 'symbol and type are required' });
    return;
  }
  const validTypes = ['forex', 'index', 'stocks', 'futures', 'crypto', 'commodities'];
  if (!validTypes.includes(type as string)) {
    res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    return;
  }
  const [dup] = await db.query<RowDataPacket[]>('SELECT id FROM assets WHERE symbol = ?', [symbol]);
  if (dup.length) {
    res.status(409).json({ error: 'An asset with this symbol already exists' });
    return;
  }
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO assets (symbol, name, type, pip_value) VALUES (?, ?, ?, ?)',
    [symbol, name ?? null, type, pip_value ?? null]
  );
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM assets WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function updateAsset(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM assets WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  if (body.symbol) {
    const [dup] = await db.query<RowDataPacket[]>('SELECT id FROM assets WHERE symbol = ? AND id != ?', [body.symbol, id]);
    if (dup.length) {
      res.status(409).json({ error: 'An asset with this symbol already exists' });
      return;
    }
  }
  const allowed = ['symbol', 'name', 'type', 'pip_value'];
  const updates: string[] = [];
  const params: unknown[] = [];
  for (const field of allowed) {
    if (field in body) {
      updates.push(`${field} = ?`);
      params.push(body[field]);
    }
  }
  if (!updates.length) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  params.push(id);
  await db.query(`UPDATE assets SET ${updates.join(', ')} WHERE id = ?`, params);
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM assets WHERE id = ?', [id]);
  res.json(rows[0]);
}

export async function deleteAsset(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM assets WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  const [trades] = await db.query<RowDataPacket[]>('SELECT id FROM trades WHERE asset_id = ? LIMIT 1', [id]);
  if (trades.length) {
    res.status(409).json({ error: 'Cannot delete asset with associated trades' });
    return;
  }
  await db.query('DELETE FROM assets WHERE id = ?', [id]);
  res.status(204).send();
}
