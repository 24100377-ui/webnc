import { Router } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const id = z.coerce.number().int().positive();
const date = z.iso.date();
const transactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.coerce.number().int().positive().max(999999999999),
  title: z.string().trim().min(1, 'Vui lòng nhập tên giao dịch').max(255),
  note: z.string().trim().max(5000).optional().nullable(),
  occurred_at: date,
  status: z.enum(['completed', 'pending']),
  account_id: id,
  to_account_id: id.optional().nullable(),
  category_id: id.optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.type === 'transfer') {
    if (!value.to_account_id || value.to_account_id === value.account_id) {
      ctx.addIssue({ code: 'custom', path: ['to_account_id'], message: 'Chọn tài khoản nhận khác tài khoản gửi' });
    }
  } else if (!value.category_id) {
    ctx.addIssue({ code: 'custom', path: ['category_id'], message: 'Vui lòng chọn danh mục' });
  }
});

const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  type: z.enum(['all', 'expense', 'income', 'transfer']).default('all'),
  account_id: id.optional(),
  category_id: id.optional(),
  from: date.optional(),
  to: date.optional(),
  sort: z.enum(['newest', 'oldest', 'amount_desc', 'amount_asc']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const selection = `t.id, t.type, t.amount, t.title, t.note, t.occurred_at, t.status,
  t.account_id, a.name AS account_name, t.to_account_id, ta.name AS to_account_name,
  t.category_id, c.name AS category_name, c.icon AS category_icon, c.color AS category_color`;
const joins = `FROM transactions t
  JOIN accounts a ON a.id = t.account_id
  LEFT JOIN accounts ta ON ta.id = t.to_account_id
  LEFT JOIN categories c ON c.id = t.category_id`;

function listWhere(query, userId) {
  const clauses = ['t.user_id = ?'];
  const params = [userId];
  if (query.search) {
    clauses.push('(t.title LIKE ? OR t.note LIKE ?)');
    const pattern = `%${query.search.replace(/[\\%_]/g, '\\$&')}%`;
    params.push(pattern, pattern);
  }
  if (query.type !== 'all') { clauses.push('t.type = ?'); params.push(query.type); }
  if (query.account_id) { clauses.push('(t.account_id = ? OR t.to_account_id = ?)'); params.push(query.account_id, query.account_id); }
  if (query.category_id) { clauses.push('t.category_id = ?'); params.push(query.category_id); }
  if (query.from) { clauses.push('t.occurred_at >= ?'); params.push(query.from); }
  if (query.to) { clauses.push('t.occurred_at <= ?'); params.push(query.to); }
  return { sql: clauses.join(' AND '), params };
}

router.get('/options', asyncHandler(async (req, res) => {
  const [accounts] = await pool.query(
    'SELECT id, name, type, balance, color, is_archived FROM accounts WHERE user_id = ? ORDER BY is_archived, name',
    [req.user.id],
  );
  const [categories] = await pool.query(
    'SELECT id, name, type, icon, color FROM categories WHERE user_id = ? ORDER BY type, name',
    [req.user.id],
  );
  res.json({ accounts, categories });
}));

router.get('/', asyncHandler(async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError(422, 'Bộ lọc không hợp lệ');
  const query = parsed.data;
  if (query.from && query.to && query.from > query.to) throw new HttpError(422, 'Ngày bắt đầu phải trước ngày kết thúc');
  const { sql, params } = listWhere(query, req.user.id);
  const order = {
    newest: 't.occurred_at DESC, t.id DESC',
    oldest: 't.occurred_at ASC, t.id ASC',
    amount_desc: 't.amount DESC, t.id DESC',
    amount_asc: 't.amount ASC, t.id ASC',
  }[query.sort];
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total ${joins} WHERE ${sql}`, params);
  const total = countRows[0].total;
  const [rows] = await pool.query(
    `SELECT ${selection} ${joins} WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...params, query.limit, (query.page - 1) * query.limit],
  );
  const [summaryRows] = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN t.type = 'income' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) AS expense,
       SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending
     ${joins} WHERE ${sql}`,
    params,
  );
  res.json({ items: rows, total, page: query.page, limit: query.limit, summary: summaryRows[0] });
}));

async function validateReferences(conn, userId, data) {
  const accountIds = [data.account_id, ...(data.type === 'transfer' ? [data.to_account_id] : [])];
  const [accounts] = await conn.query(
    `SELECT id, is_archived FROM accounts WHERE user_id = ? AND id IN (${accountIds.map(() => '?').join(',')})`,
    [userId, ...accountIds],
  );
  if (accounts.length !== accountIds.length) throw new HttpError(422, 'Tài khoản không hợp lệ');
  if (accounts.some((a) => a.is_archived)) throw new HttpError(422, 'Không thể dùng tài khoản đã lưu trữ');
  if (data.type !== 'transfer') {
    const [categories] = await conn.query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ? AND type = ?',
      [data.category_id, userId, data.type],
    );
    if (!categories.length) throw new HttpError(422, 'Danh mục không hợp lệ');
  }
}

async function adjustBalances(conn, tx, direction) {
  if (tx.status !== 'completed') return;
  const amount = Number(tx.amount) * direction;
  const changes = tx.type === 'income'
    ? [[tx.account_id, amount]]
    : tx.type === 'expense'
      ? [[tx.account_id, -amount]]
      : [[tx.account_id, -amount], [tx.to_account_id, amount]];
  for (const [accountId, delta] of changes) {
    await conn.query('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?', [delta, accountId, tx.user_id]);
  }
}

function normalized(data, userId) {
  return {
    ...data,
    user_id: userId,
    note: data.note || null,
    category_id: data.type === 'transfer' ? null : data.category_id,
    to_account_id: data.type === 'transfer' ? data.to_account_id : null,
  };
}

router.post('/', validate(transactionSchema), asyncHandler(async (req, res) => {
  const data = normalized(req.body, req.user.id);
  const transactionId = await withTransaction(async (conn) => {
    await validateReferences(conn, req.user.id, data);
    const [result] = await conn.query(
      `INSERT INTO transactions (user_id, account_id, to_account_id, category_id, type, amount, title, note, occurred_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.user_id, data.account_id, data.to_account_id, data.category_id, data.type, data.amount, data.title, data.note, data.occurred_at, data.status],
    );
    await adjustBalances(conn, data, 1);
    return result.insertId;
  });
  res.status(201).json({ id: transactionId });
}));

router.put('/:id', validate(transactionSchema), asyncHandler(async (req, res) => {
  const parsedId = id.safeParse(req.params.id);
  if (!parsedId.success) throw new HttpError(422, 'Mã giao dịch không hợp lệ');
  const txId = parsedId.data;
  const data = normalized(req.body, req.user.id);
  await withTransaction(async (conn) => {
    const [rows] = await conn.query('SELECT * FROM transactions WHERE id = ? AND user_id = ? FOR UPDATE', [txId, req.user.id]);
    if (!rows.length) throw new HttpError(404, 'Không tìm thấy giao dịch');
    await validateReferences(conn, req.user.id, data);
    await adjustBalances(conn, rows[0], -1);
    await conn.query(
      `UPDATE transactions SET account_id = ?, to_account_id = ?, category_id = ?, type = ?, amount = ?, title = ?, note = ?, occurred_at = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [data.account_id, data.to_account_id, data.category_id, data.type, data.amount, data.title, data.note, data.occurred_at, data.status, txId, req.user.id],
    );
    await adjustBalances(conn, data, 1);
  });
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const parsedId = id.safeParse(req.params.id);
  if (!parsedId.success) throw new HttpError(422, 'Mã giao dịch không hợp lệ');
  const txId = parsedId.data;
  await withTransaction(async (conn) => {
    const [rows] = await conn.query('SELECT * FROM transactions WHERE id = ? AND user_id = ? FOR UPDATE', [txId, req.user.id]);
    if (!rows.length) throw new HttpError(404, 'Không tìm thấy giao dịch');
    await adjustBalances(conn, rows[0], -1);
    await conn.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [txId, req.user.id]);
  });
  res.json({ ok: true });
}));

export default router;
