import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import accountsRouter from './routes/accounts';
import assetsRouter from './routes/assets';
import strategiesRouter from './routes/strategies';
import tradesRouter from './routes/trades';
import metricsRouter from './routes/metrics';
import exportRouter from './routes/export';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/accounts', accountsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/strategies', strategiesRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/export', exportRouter);

// Manejador global de errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    await db.query('SELECT 1');
    console.log('✓ Conexión a la base de datos verificada');
    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en el puerto: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ No se pudo conectar a la base de datos:', error);
    process.exit(1);
  }
}

startServer();