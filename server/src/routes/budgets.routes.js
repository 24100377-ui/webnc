import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Tháng không hợp lệ');
const budgetSchema = z.object({
  period: periodSchema,
  category_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().int().positive().max(999999999999),
});
const amountSchema = budgetSchema.pick({ amount: true });

router.get('/', asyncHandler(async (req, res) => {
  const parsed = periodSchema.safeParse(req.query.period);
  if (!parsed.success) throw new HttpError(422, 'Tháng không hợp lệ');
  const period = parsed.data;
  const [year, month] = period.split('-').map(Number);
  const from = `${period}-01`;
  const until = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const [rows] = await pool.query(
    `SELECT c.id AS category_id, c.name, c.icon, c.color,
            b.id AS budget_id, COALESCE(b.amount, 0) AS amount,
            COALESCE(s.spent, 0) AS spent, COALESCE(s.transaction_count, 0) AS transaction_count
     FROM categories c
     LEFT JOIN budgets b ON b.category_id = c.id AND b.user_id = c.user_id AND b.period = ?
     LEFT JOIN (
       SELECT category_id, SUM(amount) AS spent, COUNT(*) AS transaction_count
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND status = 'completed'
         AND occurred_at >= ? AND occurred_at < ?
       GROUP BY category_id
     ) s ON s.category_id = c.id
     WHERE c.user_id = ? AND c.type = 'expense'
     ORDER BY b.id IS NULL, c.name`,
    [period, req.user.id, from, until, req.user.id],
  );
  res.json({
    period,
    items: rows,
    total_budget: rows.reduce((sum, row) => sum + Number(row.amount), 0),
    total_spent: rows.reduce((sum, row) => sum + Number(row.spent), 0),
  });
}));

router.post('/', validate(budgetSchema), asyncHandler(async (req, res) => {
  const { period, category_id, amount } = req.body;
  const [categories] = await pool.query(
    "SELECT id FROM categories WHERE id = ? AND user_id = ? AND type = 'expense'",
    [category_id, req.user.id],
  );
  if (!categories.length) throw new HttpError(422, 'Danh mục chi tiêu không hợp lệ');
  const [existing] = await pool.query(
    'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND period = ?',
    [req.user.id, category_id, period],
  );
  if (existing.length) throw new HttpError(409, 'Danh mục này đã có ngân sách trong tháng');
  const [result] = await pool.query(
    'INSERT INTO budgets (user_id, category_id, period, amount) VALUES (?, ?, ?, ?)',
    [req.user.id, category_id, period, amount],
  );
  res.status(201).json({ id: result.insertId });
}));

router.put('/:id', validate(amountSchema), asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!id.success) throw new HttpError(422, 'Mã ngân sách không hợp lệ');
  const [result] = await pool.query(
    'UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?',
    [req.body.amount, id.data, req.user.id],
  );
  if (!result.affectedRows) throw new HttpError(404, 'Không tìm thấy ngân sách');
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().safeParse(req.params.id);
  if (!id.success) throw new HttpError(422, 'Mã ngân sách không hợp lệ');
  const [result] = await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id.data, req.user.id]);
  if (!result.affectedRows) throw new HttpError(404, 'Không tìm thấy ngân sách');
  res.json({ ok: true });
}));

export default router;
