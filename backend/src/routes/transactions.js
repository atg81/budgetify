const express = require('express');
const { body, param, query: queryValidator } = require('express-validator');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// GET /api/transactions
// Query params: type, category_id, start_date, end_date, limit, offset
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const {
    type,
    category_id,
    start_date,
    end_date,
    limit = 50,
    offset = 0,
    currency,
  } = req.query;

  try {
    const conditions = ['t.user_id = $1'];
    const values = [req.user.userId];
    let idx = 2;

    if (type && ['income', 'expense'].includes(type)) {
      conditions.push(`t.type = $${idx++}`);
      values.push(type);
    }
    if (category_id) {
      conditions.push(`t.category_id = $${idx++}`);
      values.push(parseInt(category_id, 10));
    }
    if (start_date) {
      conditions.push(`t.date >= $${idx++}`);
      values.push(start_date);
    }
    if (end_date) {
      conditions.push(`t.date <= $${idx++}`);
      values.push(end_date);
    }
    if (currency) {
      conditions.push(`t.currency = $${idx++}`);
      values.push(currency.toUpperCase());
    }

    const whereClause = conditions.join(' AND ');

    // Toplam kayıt sayısı (pagination için)
    const countResult = await query(
      `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Kayıtlar + kategori bilgisi
    values.push(parseInt(limit, 10));
    values.push(parseInt(offset, 10));

    const result = await query(
      `SELECT
         t.id, t.user_id, t.category_id, t.amount, t.currency,
         t.type, t.date, t.description, t.created_at,
         c.name  AS category_name,
         c.color AS category_color,
         c.emoji AS category_emoji
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: parseInt(offset, 10) + parseInt(limit, 10) < total,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/transactions/summary
// Gelir / gider özeti (opsiyonel: start_date, end_date, currency)
// ─────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  const { start_date, end_date, currency } = req.query;

  try {
    const conditions = ['user_id = $1'];
    const values = [req.user.userId];
    let idx = 2;

    if (start_date) { conditions.push(`date >= $${idx++}`); values.push(start_date); }
    if (end_date)   { conditions.push(`date <= $${idx++}`); values.push(end_date); }
    if (currency)   { conditions.push(`currency = $${idx++}`); values.push(currency.toUpperCase()); }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT
         currency,
         type,
         COUNT(*)                            AS count,
         COALESCE(SUM(amount), 0)::numeric   AS total
       FROM transactions
       WHERE ${whereClause}
       GROUP BY currency, type`,
      values
    );

    // Döviz bazında grupla
    const summary = {};
    for (const row of result.rows) {
      if (!summary[row.currency]) {
        summary[row.currency] = { income: 0, expense: 0, net: 0, income_count: 0, expense_count: 0 };
      }
      summary[row.currency][row.type] = parseFloat(row.total);
      summary[row.currency][`${row.type}_count`] = parseInt(row.count, 10);
    }

    // Net hesapla
    for (const cur of Object.keys(summary)) {
      summary[cur].net = summary[cur].income - summary[cur].expense;
    }

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('Summary error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/transactions/:id
// ─────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid transaction id')],
  validate,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await query(
        `SELECT
           t.id, t.user_id, t.category_id, t.amount, t.currency,
           t.type, t.date, t.description, t.created_at,
           c.name  AS category_name,
           c.color AS category_color,
           c.emoji AS category_emoji
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.id = $1 AND t.user_id = $2`,
        [id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get transaction error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// POST /api/transactions
// ─────────────────────────────────────────────
router.post(
  '/',
  [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number'),
    body('type')
      .isIn(['income', 'expense'])
      .withMessage('Type must be "income" or "expense"'),
    body('date')
      .isISO8601()
      .withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)'),
    body('category_id')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('category_id must be a valid UUID'),
    body('currency')
      .optional()
      .isAlpha()
      .isLength({ min: 3, max: 3 })
      .toUpperCase()
      .withMessage('Currency must be a 3-letter code (e.g. TRY, USD)'),
    body('description')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description max 500 chars'),
  ],
  validate,
  async (req, res) => {
    const { amount, type, date, category_id, currency = 'TRY', description } = req.body;

    try {
      // Kategori kullanıcıya ait veya default mu?
      if (category_id) {
        const catCheck = await query(
          'SELECT id FROM categories WHERE id = $1 AND (user_id = $2 OR is_default = true)',
          [category_id, req.user.userId]
        );
        if (catCheck.rows.length === 0) {
          return res.status(400).json({ success: false, message: 'Category not found or not accessible' });
        }
      }

      const result = await query(
        `INSERT INTO transactions (user_id, category_id, amount, currency, type, date, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, user_id, category_id, amount, currency, type, date, description, created_at`,
        [req.user.userId, category_id || null, amount, currency.toUpperCase(), type, date, description || null]
      );

      return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Create transaction error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// PUT /api/transactions/:id
// ─────────────────────────────────────────────
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid transaction id'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('type').optional().isIn(['income', 'expense']).withMessage('Type must be "income" or "expense"'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('category_id').optional({ nullable: true }).isUUID().withMessage('category_id must be a valid UUID'),
    body('currency').optional().isAlpha().isLength({ min: 3, max: 3 }).toUpperCase().withMessage('Currency must be 3-letter code'),
    body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description max 500 chars'),
  ],
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { amount, type, date, category_id, currency, description } = req.body;

    try {
      // Ownership check
      const existing = await query(
        'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      const updates = [];
      const values = [];
      let idx = 1;

      if (amount !== undefined)      { updates.push(`amount = $${idx++}`);      values.push(amount); }
      if (type !== undefined)        { updates.push(`type = $${idx++}`);        values.push(type); }
      if (date !== undefined)        { updates.push(`date = $${idx++}`);        values.push(date); }
      if (category_id !== undefined) { updates.push(`category_id = $${idx++}`); values.push(category_id); }
      if (currency !== undefined)    { updates.push(`currency = $${idx++}`);    values.push(currency.toUpperCase()); }
      if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      values.push(id);
      const result = await query(
        `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${idx}
         RETURNING id, user_id, category_id, amount, currency, type, date, description, created_at`,
        values
      );

      return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Update transaction error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ─────────────────────────────────────────────
// DELETE /api/transactions/:id
// ─────────────────────────────────────────────
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid transaction id')],
  validate,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      return res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
      console.error('Delete transaction error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

module.exports = router;
