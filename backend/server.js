const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('./utils/logger');

dotenv.config();

// Configuração Redis (Escalabilidade Sênior)
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const subClient = redisClient.duplicate();
redisClient.on('error', (err) => console.error('Erro no cliente Redis:', err));

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

io.adapter(createAdapter(redisClient, subClient));
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => {
    socket.join(`project_${projectId}`);
  });
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: { message: 'Muitas requisições deste IP, tente novamente mais tarde.' },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(globalLimiter);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const { pool } = require('./db');

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projetos', require('./routes/projects'));
app.use('/api/tarefas', require('./routes/tasks'));

const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

pool.connect()
  .then((client) => {
    client.release();
    console.log('PostgreSQL conectado');
    httpServer.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT} (com WebSockets)`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar no PostgreSQL:', err.message);
    process.exit(1);
  });


