const jwt = require('jsonwebtoken');

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  jwt.verify(token, process.env.ORI_JWT_SECRET, (err, payload) => {
    if (err || !payload || payload.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid or unauthorized admin token' });
    }
    req.admin = { username: payload.username };
    next();
  });
};

module.exports = { authenticateAdmin };


