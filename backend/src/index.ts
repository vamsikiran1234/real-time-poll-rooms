import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { connectDB } from './config/database';
import pollRoutes from './routes/pollRoutes';
import { setupSocketHandlers } from './sockets/pollSocket';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  credentials: true
};

const io = new Server(httpServer, {
  cors: corsOptions
});

const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/polls', pollRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocketHandlers(io);

const startServer = async () => {
  try {
    await connectDB();
    
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };
