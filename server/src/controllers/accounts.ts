import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db';

export async function getAccounts(_req: Request, res: Response): Promise<void> {
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM account_balances ORDER BY id');
  res.json(rows);
}

export async function getAccountById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM account_balances WHERE id = ?', [id]);
  if (!rows.length) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  res.json(rows[0]);
}

export async function createAccount(req: Request, res: Response): Promise<void> {
  const { name, currency = 'USD', initial_balance } = req.body as Record<string, unknown>;
  if (!name || initial_balance === undefined) {
    res.status(400).json({ error: 'name and initial_balance are required' });
    return;
  }
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO accounts (name, currency, initial_balance) VALUES (?, ?, ?)',
    [name, currency, initial_balance]
  );
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM account_balances WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function updateAccount(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM accounts WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  const allowed = ['name', 'currency', 'initial_balance'];
  const body = req.body as Record<string, unknown>;
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
  await db.query(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`, params);
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM account_balances WHERE id = ?', [id]);
  res.json(rows[0]);
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const [existing] = await db.query<RowDataPacket[]>('SELECT id FROM accounts WHERE id = ?', [id]);
  if (!existing.length) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  const [trades] = await db.query<RowDataPacket[]>('SELECT id FROM trades WHERE account_id = ? LIMIT 1', [id]);
  if (trades.length) {
    res.status(409).json({ error: 'Cannot delete account with associated trades' });
    return;
  }
  await db.query('DELETE FROM accounts WHERE id = ?', [id]);
  res.status(204).send();
}
