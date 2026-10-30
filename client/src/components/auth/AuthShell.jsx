import { CheckCircle2 } from 'lucide-react';

const HIGHLIGHTS = [
  'Nhìn rõ dòng tiền mỗi tháng trong một màn hình',
  'Ngân sách theo danh mục, cảnh báo trước khi vượt',
  'Mục tiêu tiết kiệm có kế hoạch từng tháng',
];

export default function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#080f1d] px-12 py-14 text-[#e8eef8] lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 65%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)' }}
        />

        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <svg viewBox="0 0 32 32" className="h-5 w-5 text-[#34d399]" aria-hidden="true">
              <path d="M10 22V10h12M10 16h9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Finora</p>
            <p className="text-[11px] text-white/50">Tài chính cá nhân</p>
          </div>
        </div>

        <div className="relative my-auto max-w-md py-12">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#34d399]">
            Quản lý tiền, nhẹ như thở
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Mọi khoản tiền của bạn,
            <br />
            trong một góc nhìn rõ ràng.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Ghi chép nhanh, hiểu dòng tiền, và để từng tháng trôi qua có chủ đích.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/35">
          Finora · đồ án quản lý tài chính cá nhân · React + Express + MySQL
        </p>
      </aside>

      <main className="flex items-center justify-center bg-[var(--bg)] px-5 py-10">
        <div className="w-full max-w-[420px] animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
