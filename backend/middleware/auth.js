const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : null;

  if (!token) return res.status(401).json({ message: 'Token ausente' });

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret);
    req.userId = payload.userId;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = authMiddleware;


