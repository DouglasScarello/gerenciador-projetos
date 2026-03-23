const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
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

const PORT = process.env.PORT || 5000;

pool.connect()
  .then((client) => {
    client.release();
    console.log('PostgreSQL conectado');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar no PostgreSQL:', err.message);
    process.exit(1);
  });


