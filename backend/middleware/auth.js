const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: 'Sessão expirada ou token ausente' });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');
    const payload = jwt.verify(token, secret);
    req.userId = payload.userId;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = authMiddleware;


