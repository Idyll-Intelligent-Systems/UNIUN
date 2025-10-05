import express from 'express';
import cors from 'cors';
import { setupMetrics, register } from './metrics';
import authRoutes from './routes/auth'
import postsRoutes from './routes/posts'
import mediaRoutes from './routes/media'
import paymentsRoutes from './routes/payments'
import interactionsRoutes from './routes/interactions'
import cartRoutes from './routes/cart'
import turnRoutes from './routes/turn'
import 'express-async-errors'

const app = express();
app.use(cors());
app.use(express.json());

setupMetrics();

app.get('/health', async (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/interactions', interactionsRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/turn', turnRoutes)

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err)
  res.status(500).json({ error: 'internal' })
})

export default app
