import { pool } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import { COOKIE_NAME, verifyToken } from '../utils/token.js';

export const PUBLIC_USER_FIELDS = `id, name, email, avatar_url, currency, locale, theme,
  month_start_day, notify_budget, notify_report, notify_tips, created_at`;

export async function requireAuth(req, _res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.[COOKIE_NAME] ?? bearer;
    if (!token) throw new HttpError(401, 'Bạn cần đăng nhập để tiếp tục');

    const payload = verifyToken(token);
    const [rows] = await pool.query(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`, [payload.sub]);
    if (rows.length === 0) throw new HttpError(401, 'Phiên đăng nhập không còn hợp lệ');

    req.user = rows[0];
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'));
  }
}
