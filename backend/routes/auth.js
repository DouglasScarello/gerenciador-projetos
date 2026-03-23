const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { pool } = require('../db');

const router = express.Router();
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Máximo de 10 tentativas por 15 min
  message: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const { rowCount } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (rowCount > 0) return res.status(400).json({ message: 'Email já cadastrado' });
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro no registro', error: err.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const { rows } = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado no servidor');

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

    return res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      })
      .json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: 'Erro no login', error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  }).json({ success: true });
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error: err.message });
  }
});

module.exports = router;


