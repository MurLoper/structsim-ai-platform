import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore, useMenuStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { getIconComponent, DefaultIcon } from '@/utils/iconMap';
import type { MenuItem } from '@/types';
import {
  SunIcon,
  MoonIcon,
  EyeIcon,
  LanguageIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  noContainer?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noContainer }) => {
  const { theme, setTheme, language, setLanguage } = useUIStore();
  const { user, logout } = useAuthStore();
  const { menus, fetchMenus, clearMenus } = useMenuStore();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);

  const t = (key: string) => RESOURCES[language][key] || key;

  // Fetch menus on mount
  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Filter visible menus (not hidden)
  const visibleMenus = menus.filter(menu => !menu.hidden);

  const toggleSubmenu = (menuId: number) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const isMenuActive = (menu: MenuItem): boolean => {
    if (location.pathname === menu.path) return true;
    if (menu.children?.length) {
      return menu.children.some(child => location.pathname === child.path);
    }
    return false;
  };

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
          {visibleMenus.map(menu => {
            const Icon = getIconComponent(menu.icon) || DefaultIcon;
            const hasChildren = menu.children?.filter(c => !c.hidden).length > 0;
            const isExpanded = expandedMenus.includes(menu.id);
            const isActive = isMenuActive(menu);
            const menuLabel = menu.titleI18nKey ? t(menu.titleI18nKey) : menu.name;

            if (hasChildren) {
              return (
                <div key={menu.id}>
                  <button
                    onClick={() => toggleSubmenu(menu.id)}
                    title={sidebarCollapsed ? menuLabel : undefined}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      sidebarCollapsed && 'justify-center',
                      getNavItemClasses(isActive)
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{menuLabel}</span>
                        <ChevronDownIcon
                          className={clsx(
                            'w-4 h-4 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!sidebarCollapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {menu.children
                        .filter(c => !c.hidden)
                        .map(child => {
                          const ChildIcon = getIconComponent(child.icon) || DefaultIcon;
                          const childLabel = child.titleI18nKey
                            ? t(child.titleI18nKey)
                            : child.name;
                          return (
                            <Link
                              key={child.id}
                              to={child.path}
                              className={clsx(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                                getNavItemClasses(location.pathname === child.path)
                              )}
                            >
                              <ChildIcon className="w-4 h-4 flex-shrink-0" />
                              {childLabel}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={menu.id}
                to={menu.path}
                title={sidebarCollapsed ? menuLabel : undefined}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  sidebarCollapsed && 'justify-center',
                  getNavItemClasses(location.pathname === menu.path)
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && menuLabel}
              </Link>
            );
          })}
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
