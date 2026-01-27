import React, { useState } from 'react';
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
  ChevronLeftIcon,
  ChevronRightIcon,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const t = (key: string) => RESOURCES[language][key] || key;

  const getThemeClasses = () => {
    if (theme === 'eyecare') return 'bg-background text-foreground';
    return 'bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100';
  };

  const getSidebarClasses = () => {
    if (theme === 'eyecare') {
      return 'bg-card text-card-foreground border-border';
    }
    return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  };

  const getNavItemClasses = (isActive: boolean) => {
    if (theme === 'eyecare') {
      return isActive ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary/50';
    }
    return isActive
      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400';
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
      <aside
        className={clsx(
          'fixed h-full z-40 border-r flex flex-col shadow-lg transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          getSidebarClasses()
        )}
      >
        {/* Brand */}
        <div
          className={clsx(
            'h-16 flex items-center border-b transition-all duration-300',
            sidebarCollapsed ? 'px-3 justify-center' : 'px-6',
            theme === 'eyecare' ? 'border-border' : 'border-slate-200 dark:border-slate-700'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            S
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-lg tracking-tight truncate ml-3">{t('app.title')}</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              title={sidebarCollapsed ? item.name : undefined}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                sidebarCollapsed && 'justify-center',
                getNavItemClasses(location.pathname === item.path)
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && item.name}
            </Link>
          ))}
        </nav>

        {/* User & Settings Footer */}
        <div
          className={clsx(
            'p-4 border-t space-y-4',
            theme === 'eyecare' ? 'border-border' : 'border-slate-200 dark:border-slate-700'
          )}
        >
          {/* User Profile */}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-2">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  theme === 'eyecare'
                    ? 'bg-secondary text-muted-foreground'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                )}
              >
                <UserCircleIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={clsx(
                    'text-sm font-medium truncate',
                    theme === 'eyecare' ? 'text-foreground' : 'text-slate-900 dark:text-white'
                  )}
                >
                  {user?.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Theme & Language */}
          <div
            className={clsx(
              'flex items-center px-2',
              sidebarCollapsed ? 'flex-col gap-2' : 'justify-between'
            )}
          >
            {!sidebarCollapsed && (
              <button
                onClick={toggleLanguage}
                className={clsx(
                  'flex items-center gap-1.5 text-xs font-semibold hover:text-primary',
                  theme === 'eyecare'
                    ? 'text-muted-foreground'
                    : 'text-slate-600 dark:text-slate-300'
                )}
              >
                <LanguageIcon className="w-4 h-4" />
                {t('lang.switch')}
              </button>
            )}

            <div
              className={clsx(
                'flex items-center gap-1 p-1 rounded-full',
                theme === 'eyecare' ? 'bg-secondary' : 'bg-slate-100 dark:bg-slate-700'
              )}
            >
              <button
                onClick={() => setTheme('light')}
                className={clsx(
                  'p-1 rounded-full',
                  theme === 'light' ? 'bg-white shadow text-amber-500' : 'text-muted-foreground'
                )}
                title="Light"
              >
                <SunIcon className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={clsx(
                  'p-1 rounded-full',
                  theme === 'dark' ? 'bg-slate-600 shadow text-indigo-400' : 'text-muted-foreground'
                )}
                title="Dark"
              >
                <MoonIcon className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTheme('eyecare')}
                className={clsx(
                  'p-1 rounded-full',
                  theme === 'eyecare'
                    ? 'bg-background shadow text-primary'
                    : 'text-muted-foreground'
                )}
                title="Eye Care"
              >
                <EyeIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Collapse Toggle - Floating Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={clsx(
          'fixed z-50 top-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center',
          'rounded-r-lg shadow-md border border-l-0 transition-all duration-300',
          'hover:w-8 group',
          sidebarCollapsed ? 'left-16' : 'left-64',
          theme === 'eyecare'
            ? 'bg-card border-border text-muted-foreground hover:text-primary'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400'
        )}
        title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
      >
        {sidebarCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* Main Content */}
      <main
        className={clsx(
          'flex-1 overflow-y-auto h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64',
          !noContainer && 'p-8'
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
