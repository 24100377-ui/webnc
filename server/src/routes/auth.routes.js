import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, PUBLIC_USER_FIELDS } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/errors.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Bạn thử quá nhiều lần, vui lòng đợi 15 phút' } },
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(100),
  email: z.email('Email không hợp lệ').max(190).toLowerCase(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(72),
});

const loginSchema = z.object({
  email: z.email('Email không hợp lệ').toLowerCase(),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const DEFAULT_CATEGORIES = [
  { name: 'Nhà ở', icon: 'home', color: '#6366f1' },
  { name: 'Ăn uống', icon: 'coffee', color: '#f59e0b' },
  { name: 'Mua sắm', icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Hóa đơn', icon: 'zap', color: '#06b6d4' },
  { name: 'Di chuyển', icon: 'navigation', color: '#3b82f6' },
  { name: 'Giải trí', icon: 'music', color: '#8b5cf6' },
  { name: 'Khác', icon: 'more-horizontal', color: '#94a3b8' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Thu nhập', icon: 'wallet', color: '#10b981' },
  { name: 'Thu nhập khác', icon: 'sparkles', color: '#22c55e' },
];

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new HttpError(409, 'Email này đã được đăng ký');

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
    );
    const userId = result.insertId;

    await pool.query(
      'INSERT INTO accounts (user_id, name, type, balance, icon, color) VALUES (?, ?, ?, 0, ?, ?)',
      [userId, 'Tiền mặt', 'cash', 'banknote', '#f59e0b'],
    );

    const values = [
      ...DEFAULT_CATEGORIES.map((c) => [userId, c.name, 'expense', c.icon, c.color, 1]),
      ...DEFAULT_INCOME_CATEGORIES.map((c) => [userId, c.name, 'income', c.icon, c.color, 1]),
    ];
    await pool.query(
      'INSERT INTO categories (user_id, name, type, icon, color, is_system) VALUES ?',
      [values],
    );

    const [rows] = await pool.query(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`, [userId]);
    setAuthCookie(res, signToken(userId));
    res.status(201).json({ user: rows[0] });
  }),
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT id, password_hash FROM users WHERE email = ?`,
      [email],
    );
    const user = rows[0];
    if (!user) throw new HttpError(401, 'Email hoặc mật khẩu không đúng');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new HttpError(401, 'Email hoặc mật khẩu không đúng');

    const [profile] = await pool.query(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`, [user.id]);
    setAuthCookie(res, signToken(user.id));
    res.json({ user: profile[0] });
  }),
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
