import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    if (error) setError('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng nhập thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: 'manh@finora.vn', password: '123456' });
    setError('');
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <p className="eyebrow">Chào mừng trở lại</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Đăng nhập Finora</h2>
        <p className="mt-1.5 text-sm muted">Tiếp tục theo dõi dòng tiền của bạn.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 muted" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={onChange}
              placeholder="ban@email.com"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 muted" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={onChange}
              placeholder="Tối thiểu 6 ký tự"
              className="input pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 muted hover:text-[var(--text)]"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>

      <button
        type="button"
        onClick={fillDemo}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs font-semibold muted transition hover:text-[var(--text)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
        Dùng tài khoản demo (manh@finora.vn / 123456)
      </button>

      <p className="mt-6 text-center text-sm muted">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
          Tạo tài khoản
        </Link>
      </p>
    </AuthShell>
  );
}
