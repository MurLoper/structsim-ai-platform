import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '@/stores';
import { RESOURCES } from '@/locales';
import {
  SunIcon,
  MoonIcon,
  EyeIcon,
  HomeIcon,
  PlusCircleIcon,
  LanguageIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  noContainer?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noContainer }) => {
  const { theme, setTheme, language, setLanguage } = useUIStore();
  const { user, logout, hasPermission } = useAuthStore();
  const location = useLocation();

  const t = (key: string) => RESOURCES[language][key] || key;

  const getThemeClasses = () => {
    if (theme === 'eyecare') return 'bg-eyecare-bg text-eyecare-text';
    return 'bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100';
  };

  const allNavItems = [
    { name: t('nav.dashboard'), path: '/', icon: HomeIcon, perm: 'VIEW_DASHBOARD' as const },
    {
      name: t('nav.new_request'),
      path: '/create',
      icon: PlusCircleIcon,
      perm: 'CREATE_ORDER' as const,
    },
    { name: t('nav.config'), path: '/config', icon: Cog6ToothIcon, perm: 'MANAGE_CONFIG' as const },
    {
      name: t('nav.access'),
      path: '/access',
      icon: ShieldCheckIcon,
      perm: 'MANAGE_USERS' as const,
    },
  ];

  const navItems = allNavItems.filter(item => hasPermission(item.perm));

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/#/login';
  };

  return (
    <div className={clsx('min-h-screen flex transition-colors duration-300', getThemeClasses())}>
      {/* Sidebar */}
      <aside className="w-64 fixed h-full z-40 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-lg">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl mr-3">
            S
          </div>
          <span className="font-bold text-lg tracking-tight truncate">{t('app.title')}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                location.pathname === item.path
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User & Settings Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
              <UserCircleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-slate-900 dark:text-white">
                {user?.name}
              </div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Theme & Language */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600"
            >
              <LanguageIcon className="w-4 h-4" />
              {t('lang.switch')}
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-full">
              <button
                onClick={() => setTheme('light')}
                className={clsx(
                  'p-1 rounded-full',
                  theme === 'light' ? 'bg-white shadow text-amber-500' : 'text-slate-400'
                )}
              >
                <SunIcon className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={clsx(
                  'p-1 rounded-full',
                  theme === 'dark' ? 'bg-slate-600 shadow text-indigo-400' : 'text-slate-400'
                )}
              >
                <MoonIcon className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTheme('eyecare')}
                className={clsx(
                  'p-1 rounded-full',
                  theme === 'eyecare'
                    ? 'bg-eyecare-bg shadow text-eyecare-accent'
                    : 'text-slate-400'
                )}
              >
                <EyeIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={clsx('flex-1 ml-64 overflow-y-auto h-screen', !noContainer && 'p-8')}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
