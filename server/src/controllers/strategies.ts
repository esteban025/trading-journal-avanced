import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db';

export async function getStrategies(_req: Request, res: Response): Promise<void> {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM strategies ORDER BY name');
  res.json(rows);
}

export async function getStrategyById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM strategies WHERE id = ?', [id]);
  if (!rows.length) {
    res.status(404).json({ error: 'Strategy not found' });
    return;
  }
  res.json(rows[0]);
}

export async function createStrategy(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body as Record<string, unknown>;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const [dup] = await db.query<RowDataPacket[]>('SELECT id FROM strategies WHERE name = ?', [name]);
  if (dup.length) {
    res.status(409).json({ error: 'A strategy with this name already exists' });
    return;
  }
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO strategies (name, description) VALUES (?, ?)',
    [name, description ?? null]
  );
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM strategies WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function updateStrategy(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM strategies WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Strategy not found' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  if (body.name) {
    const [dup] = await db.query<RowDataPacket[]>('SELECT id FROM strategies WHERE name = ? AND id != ?', [body.name, id]);
    if (dup.length) {
      res.status(409).json({ error: 'A strategy with this name already exists' });
      return;
    }
  }
  const allowed = ['name', 'description'];
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
  await db.query(`UPDATE strategies SET ${updates.join(', ')} WHERE id = ?`, params);
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM strategies WHERE id = ?', [id]);
  res.json(rows[0]);
}

export async function deleteStrategy(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM strategies WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Strategy not found' });
    return;
  }
  const [trades] = await db.query<RowDataPacket[]>('SELECT id FROM trades WHERE strategy_id = ? LIMIT 1', [id]);
  if (trades.length) {
    res.status(409).json({ error: 'Cannot delete strategy with associated trades' });
    return;
  }
  await db.query('DELETE FROM strategies WHERE id = ?', [id]);
  res.status(204).send();
}
