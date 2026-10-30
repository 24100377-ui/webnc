import { HttpError } from '../utils/errors.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new HttpError(422, 'Dữ liệu không hợp lệ', details));
  }
  req[source] = result.data;
  next();
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { message: err.message, details: err.details },
    });
  }

  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: { message: 'Dữ liệu đã tồn tại' } });
  }

  console.error('[server]', err);
  return res.status(500).json({ error: { message: 'Có lỗi xảy ra, vui lòng thử lại sau' } });
}
