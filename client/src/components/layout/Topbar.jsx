import { useEffect, useRef, useState } from 'react';
import { LogOut, Menu, Moon, Sun, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials, todayLong } from '../../lib/format';
import { applyTheme, getStoredTheme, saveTheme } from '../../lib/theme';

export default function Topbar({ onOpenMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getStoredTheme());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveTheme(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md md:px-6"
      style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2 muted hover:bg-[var(--surface-2)] lg:hidden"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <p className="hidden text-xs font-semibold tracking-wide muted sm:block">{todayLong()}</p>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl border p-2.5 muted transition hover:text-[var(--text)]"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Đổi giao diện"
          title="Đổi giao diện"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border px-2 py-1.5 transition hover:bg-[var(--surface-2)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent)]">
              {initials(user?.name)}
            </span>
            <span className="hidden max-w-[140px] truncate text-sm font-semibold md:block">{user?.name}</span>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-[var(--surface)] p-1.5 shadow-xl"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-[11px] muted">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
              >
                <UserRound className="h-4 w-4" /> Cài đặt tài khoản
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
