import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cycloneRoutes from './routes/cycloneRoutes.js';
import { verifyFirebaseAuth } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'deadeye-backend-gateway' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), service: 'deadeye-backend-gateway' }));

app.use('/api', verifyFirebaseAuth, cycloneRoutes);

app.listen(PORT, () => {
  console.log(`[DeadEye Gateway] Listening on http://localhost:${PORT}`);
});