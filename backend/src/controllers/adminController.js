const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    const adminUser = process.env.ORI_ADMIN_USERNAME;
    const adminPass = process.env.ORI_ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      return res
        .status(500)
        .json({ error: 'Admin credentials are not configured' });
    }

    if (username !== adminUser || password !== adminPass) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { username: adminUser, role: 'admin' },
      process.env.ORI_JWT_SECRET,
      { expiresIn: process.env.ORI_ADMIN_JWT_EXPIRES_IN || '1h' }
    );

    res.json({ message: 'Admin login successful', token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const listUsers = async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res
        .status(400)
        .json({ error: 'new_password is required to reset password' });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(new_password, saltRounds);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, id]
    );

    res.json({ message: 'User password reset successfully' });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  adminLogin,
  listUsers,
  resetUserPassword,
};


