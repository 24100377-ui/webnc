import { useEffect, useState } from 'react';
import { ArrowUpRight, Clock3, Database, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { initials } from '../lib/format';

const KPIS = [
  { label: 'Tổng số dư', hint: 'Tổng tài sản ròng', tone: 'text-[var(--text)]' },
  { label: 'Thu nhập tháng này', hint: 'Tiền vào đã hoàn tất', tone: 'text-emerald-500' },
  { label: 'Chi tiêu tháng này', hint: 'Tiền ra đã hoàn tất', tone: 'text-rose-500' },
  { label: 'Tiết kiệm tháng này', hint: 'Thu nhập − chi tiêu', tone: 'text-sky-500' },
];

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

export default function Dashboard() {
  const { user } = useAuth();
  const [health, setHealth] = useState({ state: 'loading', db: false });

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth({ state: 'ok', db: Boolean(res.data.db) }))
      .catch(() => setHealth({ state: 'down', db: false }));
  }, []);

  const firstName = user?.name?.trim().split(/\s+/).slice(-1)[0] || 'bạn';

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tổng quan</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1.5 max-w-xl text-sm muted">
            Theo dõi tài chính của bạn tại đây.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className={`h-2 w-2 rounded-full ${health.db ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {health.db ? 'MySQL đã kết nối' : health.state === 'loading' ? 'Đang kiểm tra…' : 'Chưa kết nối DB'}
          </span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi, index) => (
          <article key={kpi.label} className="card p-5" style={{ animationDelay: `${index * 40}ms` }}>
            <p className="text-xs font-semibold muted">{kpi.label}</p>
            <div
              className="mt-3 h-7 w-24 animate-pulse rounded-lg"
              style={{ background: 'var(--border)' }}
              aria-label="Chưa có dữ liệu"
            />
            <p className="mt-2 text-[11px] muted">{kpi.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <article className="card p-6">
          <p className="eyebrow">Phiên đăng nhập</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-extrabold text-[var(--accent)]">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.name}</p>
              <p className="truncate text-xs muted">{user?.email}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="muted">Xác thực</dt>
              <dd className="font-semibold">JWT · cookie httpOnly</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">Thời hạn</dt>
              <dd className="font-semibold">7 ngày</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">Tiền tệ</dt>
              <dd className="font-semibold">{user?.currency === 'USD' ? 'USD' : 'VNĐ'}</dd>
            </div>
          </dl>
        </article>

        <article className="card p-6">
          <p className="eyebrow">Hạ tầng</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <Server className="h-4 w-4 muted" />
              Express API
              <span className={`ml-auto text-[11px] font-bold ${health.state === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {health.state === 'ok' ? 'online' : health.state === 'loading' ? '…' : 'offline'}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Database className="h-4 w-4 muted" />
              MySQL <code className="text-[11px] muted">finora</code>
              <span className={`ml-auto text-[11px] font-bold ${health.db ? 'text-emerald-500' : 'text-amber-500'}`}>
                {health.db ? 'connected' : 'pending'}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock3 className="h-4 w-4 muted" />
              Cập nhật gần nhất
              <span className="ml-auto text-[11px] font-semibold muted">vừa xong</span>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
