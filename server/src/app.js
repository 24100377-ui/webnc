import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { pingDatabase } from './config/db.js';
import { errorHandler } from './middleware/validate.js';
import authRoutes from './routes/auth.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/health', async (_req, res) => {
  const db = await pingDatabase().catch(() => false);
  res.status(db ? 200 : 503).json({
    ok: db,
    service: 'finora-api',
    db,
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Không tìm thấy đường dẫn' } });
});

app.use(errorHandler);
