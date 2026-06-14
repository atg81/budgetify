const express = require('express');
const { body, param, query: queryValidator } = require('express-validator');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Tüm rotalar için authentication zorunlu
router.use(authenticate);

// ─────────────────────────────────────────────
// GET /api/categories
// is_default=true olanları tüm kullanıcılara göster,
// kullanıcının kendi kategorilerini de dahil et
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, name, color, emoji, is_default, created_at
       FROM categories
       WHERE is_default = true OR user_id = $1
       ORDER BY is_default DESC, name ASC`,
      [req.user.userId]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get categories error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/categories/:id
// ─────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid category id')],
  validate,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await query(
        `SELECT id, user_id, name, color, emoji, is_default, created_at
         FROM categories
         WHERE id = $1 AND (is_default = true OR user_id = $2)`,
        [id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get category error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// POST /api/categories
// ─────────────────────────────────────────────
router.post(
  '/',
  [
    body('name').notEmpty().trim().isLength({ max: 100 }).withMessage('Name is required (max 100 chars)'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color (e.g. #FF5733)'),
    body('emoji').optional().isString().isLength({ max: 10 }).withMessage('Emoji must be a short string'),
  ],
  validate,
  async (req, res) => {
    const { name, color, emoji } = req.body;

    try {
      const result = await query(
        `INSERT INTO categories (user_id, name, color, emoji, is_default, created_at)
         VALUES ($1, $2, $3, $4, false, NOW())
         RETURNING id, user_id, name, color, emoji, is_default, created_at`,
        [req.user.userId, name, color || null, emoji || null]
      );

      return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Create category error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// PUT /api/categories/:id
// Sadece kullanıcının kendi kategorileri
// ─────────────────────────────────────────────
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid category id'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 chars'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
    body('emoji').optional().isString().isLength({ max: 10 }).withMessage('Emoji must be a short string'),
  ],
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { name, color, emoji } = req.body;

    try {
      // Önce sahipliği kontrol et (default olanlar düzenlenemez)
      const existing = await query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND is_default = false',
        [id, req.user.userId]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found or cannot be edited' });
      }

      const updates = [];
      const values = [];
      let idx = 1;

      if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
      if (color !== undefined) { updates.push(`color = $${idx++}`); values.push(color); }
      if (emoji !== undefined) { updates.push(`emoji = $${idx++}`); values.push(emoji); }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      values.push(id);
      const result = await query(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = $${idx}
         RETURNING id, user_id, name, color, emoji, is_default, created_at`,
        values
      );

      return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Update category error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// DELETE /api/categories/:id
// Sadece kullanıcının kendi kategorileri
// ─────────────────────────────────────────────
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid category id')],
  validate,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await query(
        'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = false RETURNING id',
        [id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Category not found or cannot be deleted' });
      }

      return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

module.exports = router;
