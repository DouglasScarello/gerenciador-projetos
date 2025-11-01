const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: 'Erro no login', error: err.message });
  }
});

module.exports = router;


