import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { EyeIcon } from '@heroicons/react/24/outline';
import { Leaf } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore, useMenuStore, useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { getIconComponent, DefaultIcon } from '@/utils/iconMap';
import type { MenuItem } from '@/types';
import { LayoutAnnouncementBanner } from './LayoutAnnouncementBanner';
import { LayoutUserMenu } from './LayoutUserMenu';

interface LayoutProps {
  children: React.ReactNode;
  noContainer?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noContainer }) => {
  const { theme, setTheme, language, setLanguage } = useUIStore();
  const { user, logout } = useAuthStore();
  const { menus, fetchMenus } = useMenuStore();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);

  const t = useMemo(() => (key: string) => RESOURCES[language][key] || key, [language]);
  const visibleMenus = useMemo(() => menus.filter(menu => !menu.hidden), [menus]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const toggleSubmenu = (menuId: number) => {
    setExpandedMenus(previous =>
      previous.includes(menuId) ? previous.filter(id => id !== menuId) : [...previous, menuId]
    );
  };

  const isMenuActive = (menu: MenuItem): boolean => {
    if (location.pathname === menu.path) {
      return true;
    }
    if (menu.children?.length) {
      return menu.children.some(child => location.pathname === child.path);
    }
    return false;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/#/login';
  };

  const navItemClass = (active: boolean) =>
    clsx(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
      active
        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 eyecare:bg-secondary eyecare:text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  const themeButtonClass = (active: boolean, activeClassName: string) =>
    clsx('rounded-full p-1 transition-all', active ? activeClassName : 'text-muted-foreground');

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <aside
        className={clsx(
          'fixed z-40 flex h-full flex-col border-r border-border bg-card shadow-lg transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div
          className={clsx(
            'flex h-16 items-center border-b border-border transition-all duration-300',
            sidebarCollapsed ? 'justify-center px-3' : 'px-6'
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 text-xl font-bold text-white">
            S
          </div>
          {!sidebarCollapsed && (
            <span className="ml-3 truncate text-lg font-bold tracking-tight">{t('app.title')}</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-6">
          {visibleMenus.map(menu => {
            const Icon = getIconComponent(menu.icon) || DefaultIcon;
            const visibleChildren = menu.children?.filter(child => !child.hidden) || [];
            const hasChildren = visibleChildren.length > 0;
            const isExpanded = expandedMenus.includes(menu.id);
            const active = isMenuActive(menu);
            const menuLabel = menu.titleI18nKey ? t(menu.titleI18nKey) : menu.name;

            if (hasChildren) {
              return (
                <div key={menu.id}>
                  <button
                    onClick={() => toggleSubmenu(menu.id)}
                    title={sidebarCollapsed ? menuLabel : undefined}
                    className={clsx(navItemClass(active), sidebarCollapsed && 'justify-center')}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{menuLabel}</span>
                        <ChevronDownIcon
                          className={clsx(
                            'h-4 w-4 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>

                  {!sidebarCollapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {visibleChildren.map(child => {
                        const ChildIcon = getIconComponent(child.icon) || DefaultIcon;
                        const childLabel = child.titleI18nKey ? t(child.titleI18nKey) : child.name;
                        if (!child.path) {
                          return null;
                        }
                        return (
                          <Link
                            key={child.id}
                            to={child.path}
                            className={clsx(
                              navItemClass(location.pathname === child.path),
                              'text-sm font-normal'
                            )}
                          >
                            <ChildIcon className="h-4 w-4 flex-shrink-0" />
                            {childLabel}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (!menu.path) {
              return null;
            }

            return (
              <Link
                key={menu.id}
                to={menu.path}
                title={sidebarCollapsed ? menuLabel : undefined}
                className={clsx(
                  navItemClass(location.pathname === menu.path),
                  sidebarCollapsed && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && menuLabel}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-4 border-t border-border p-4">
          <LayoutUserMenu user={user} onLogout={handleLogout} compact={sidebarCollapsed} />

          <div
            className={clsx(
              'flex items-center px-2',
              sidebarCollapsed ? 'flex-col gap-2' : 'justify-between'
            )}
          >
            {!sidebarCollapsed && (
              <button
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                <LanguageIcon className="h-4 w-4" />
                {t('lang.switch')}
              </button>
            )}

            <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
              <button
                onClick={() => setTheme('light')}
                className={themeButtonClass(theme === 'light', 'bg-card shadow text-amber-500')}
                title="浅色主题"
              >
                <SunIcon className="h-3 w-3" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={themeButtonClass(theme === 'dark', 'bg-card shadow text-indigo-400')}
                title="深色主题"
              >
                <MoonIcon className="h-3 w-3" />
              </button>
              <button
                onClick={() => setTheme('eyecare-green')}
                className={themeButtonClass(
                  theme === 'eyecare-green',
                  'bg-card shadow text-green-600'
                )}
                title="护眼绿主题"
              >
                <Leaf className="h-3 w-3" />
              </button>
              <button
                onClick={() => setTheme('eyecare-warm')}
                className={themeButtonClass(
                  theme === 'eyecare-warm',
                  'bg-card shadow text-amber-600'
                )}
                title="护眼暖色主题"
              >
                <EyeIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={clsx(
          'fixed top-1/2 z-50 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-border bg-card text-muted-foreground shadow-md transition-all duration-300 hover:w-8 hover:text-primary',
          sidebarCollapsed ? 'left-16' : 'left-64'
        )}
        title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
      >
        {sidebarCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
        )}
      </button>

      <main
        className={clsx(
          'relative h-screen flex-1 overflow-y-auto transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <LayoutAnnouncementBanner />
        <div className={clsx('h-full', !noContainer && 'p-8')}>{children}</div>
      </main>
    </div>
  );
};

export default Layout;
