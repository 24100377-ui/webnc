import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { applyTheme, getStoredTheme } from '../../lib/theme';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem('finora-sidebar') === 'collapsed',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      window.localStorage.setItem('finora-sidebar', prev ? 'open' : 'collapsed');
      return !prev;
    });
  };

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className={['transition-all duration-200', collapsed ? 'lg:pl-[84px]' : 'lg:pl-[268px]'].join(' ')}>
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
