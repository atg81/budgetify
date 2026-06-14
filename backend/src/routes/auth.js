const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { query } = require('../db');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().trim().withMessage('Name is required'),
  ],
  validate,
  async (req, res) => {
    const { email, password, name } = req.body;

    try {
      // Kullanıcı zaten var mı?
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use',
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, email, full_name AS name, created_at`,
        [email, passwordHash, name]
      );

      const user = result.rows[0];

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at },
          token,
        },
      });
    } catch (error) {
      console.error('Register error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await query(
        'SELECT id, email, full_name AS name, password_hash, created_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// GET /api/auth/me  (kendi profili)
// ─────────────────────────────────────────────
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, full_name AS name, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
