import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
});

export function getErrorMessage(error, fallback = 'Có lỗi xảy ra, vui lòng thử lại') {
  const payload = error?.response?.data?.error;
  if (payload?.details?.length) return payload.details[0].message;
  return payload?.message || error?.message || fallback;
}
