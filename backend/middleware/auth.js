const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'autobody-secret-key-2024');
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = auth;
