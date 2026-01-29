// Dynamic route generation utility
import { lazy, type ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { MenuItem } from '@/types';

// Page component lazy loader map
const pageComponents: Record<string, () => Promise<{ default: ComponentType }>> = {
  'pages/dashboard/Dashboard': () => import('@/pages/dashboard/Dashboard'),
  'pages/orders/OrderList': () => import('@/pages/orders/OrderList'),
  'pages/orders/OrderDetail': () => import('@/pages/orders/OrderList'),
  'pages/submission/SubmissionPage': () => import('@/pages/submission'),
  'pages/results/ResultsPage': () => import('@/pages/dashboard/Results'),
  'pages/configuration/ProjectsPage': () => import('@/pages/configuration/Configuration'),
  'pages/configuration/SimTypesPage': () => import('@/pages/configuration/Configuration'),
  'pages/configuration/ParametersPage': () => import('@/pages/configuration/Configuration'),
  'pages/configuration/OutputsPage': () => import('@/pages/configuration/Configuration'),
  'pages/configuration/SolversPage': () => import('@/pages/configuration/Configuration'),
};

/**
 * Get lazy component by component path
 */
export const getLazyComponent = (componentPath: string | null) => {
  if (!componentPath) return null;
  const loader = pageComponents[componentPath];
  if (!loader) {
    console.warn(`Component not found: ${componentPath}`);
    return null;
  }
  return lazy(loader);
};

/**
 * Generate routes from menu items
 */
export const generateRoutesFromMenus = (menus: MenuItem[]): RouteObject[] => {
  const routes: RouteObject[] = [];

  const processMenu = (menu: MenuItem) => {
    if (menu.component) {
      const Component = getLazyComponent(menu.component);
      if (Component) {
        routes.push({
          path: menu.path === '/' ? undefined : menu.path.replace(/^\//, ''),
          index: menu.path === '/',
          element: <Component />,
          handle: {
            title: menu.name,
            permission: menu.permissionCode,
          },
        });
      }
    }

    // Process children
    if (menu.children?.length) {
      menu.children.forEach(processMenu);
    }
  };

  menus.forEach(processMenu);
  return routes;
};
