import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Settings,
  Sparkles,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../lib/format';

export const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Giao dịch', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Ngân sách', icon: Wallet },
  { to: '/accounts', label: 'Ví & tài khoản', icon: CreditCard },
  { to: '/savings', label: 'Tiết kiệm', icon: PiggyBank },
  { to: '/reports', label: 'Báo cáo & phân tích', icon: BarChart3 },
  { to: '/goals', label: 'Mục tiêu tài chính', icon: Target },
  { to: '/bills', label: 'Hóa đơn định kỳ', icon: ReceiptText },
];

export function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b1120] text-[#34d399]">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <path d="M10 22V10h12M10 16h9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight">Finora</p>
          <p className="text-[11px] font-medium muted">Tài chính cá nhân</p>
        </div>
      )}
    </div>
  );
}

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
          isActive
            ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]'
            : 'font-medium muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
          collapsed ? 'justify-center' : '',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.3 : 1.9} />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {isActive && !collapsed && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-[var(--surface)] transition-all duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[84px]' : 'w-[268px]',
        ].join(' ')}
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-6">
          <Logo collapsed={collapsed} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 muted hover:bg-[var(--surface-2)] lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {!collapsed && <p className="eyebrow px-3 pb-2 pt-1">Không gian của bạn</p>}
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onClose} />
          ))}

          {!collapsed && <p className="eyebrow px-3 pb-2 pt-5">Khác</p>}
          <NavItem
            item={{ to: '/settings', label: 'Cài đặt', icon: Settings }}
            collapsed={collapsed}
            onNavigate={onClose}
          />
        </nav>

        {!collapsed && (
          <div className="mx-3 mb-3 rounded-xl border border-dashed p-3" style={{ borderColor: 'var(--border)' }}>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Finora Insights
            </div>
            <p className="text-[11px] leading-relaxed muted">
              Gợi ý thông minh sẽ xuất hiện khi bạn có đủ dữ liệu giao dịch.
            </p>
          </div>
        )}

        <div className="border-t px-3 py-3" style={{ borderColor: 'var(--border)' }}>
          <div className={['flex items-center gap-3 rounded-xl p-2', collapsed ? 'justify-center' : ''].join(' ')}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
              {initials(user?.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-[11px] muted">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-semibold muted hover:bg-[var(--surface-2)] lg:flex"
          >
            <ChevronLeft className={['h-3.5 w-3.5 transition-transform', collapsed ? 'rotate-180' : ''].join(' ')} />
            {!collapsed && 'Thu gọn sidebar'}
          </button>
        </div>
      </aside>
    </>
  );
}
