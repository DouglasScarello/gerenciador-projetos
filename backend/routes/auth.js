const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.', code: 'TOO_MANY_REQUESTS' } }
});

router.post('/register', catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    throw new AppError('Email inválido', 400);
  }

  const { rowCount } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (rowCount > 0) throw new AppError('Email já cadastrado', 400);

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id, name, email',
    [name, email, passwordHash]
  );

  res.status(201).json({ success: true, data: rows[0] });
}));

router.post('/login', loginLimiter, catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    throw new AppError('Email inválido', 400);
  }

  const { rows } = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado no servidor');

  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
}));

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  }).json({ success: true });
});

router.get('/me', auth, catchAsync(async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
  if (!rows[0]) throw new AppError('Usuário não encontrado', 404);
  res.json({ success: true, data: rows[0] });
}));

module.exports = router;
