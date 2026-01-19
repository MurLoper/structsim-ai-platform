import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from './ThemeProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * 应用根级 Providers 组合
 *
 * 层级结构:
 * 1. QueryClientProvider - TanStack Query 数据缓存
 * 2. ThemeProvider - 主题管理
 * 3. 其他 Providers (Toast 等) 可在此添加
 *
 * 注意: 开发环境会显示 React Query DevTools
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
