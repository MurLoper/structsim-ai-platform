/**
 * Suspense 边界组件
 *
 * 为懒加载组件提供统一的加载状态显示
 */
import { Suspense, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SuspenseBoundaryProps {
  children: ReactNode;
  /** 自定义加载组件 */
  fallback?: ReactNode;
  /** 加载类型 */
  type?: 'page' | 'component' | 'inline';
  /** 自定义类名 */
  className?: string;
}

/**
 * 页面级加载组件
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}

/**
 * 组件级加载
 */
function ComponentLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    </div>
  );
}

/**
 * 行内加载
 */
function InlineLoader() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </span>
  );
}

/**
 * Suspense 边界
 */
export function SuspenseBoundary({
  children,
  fallback,
  type = 'page',
  className,
}: SuspenseBoundaryProps) {
  const defaultFallback = {
    page: <PageLoader />,
    component: <ComponentLoader className={className} />,
    inline: <InlineLoader />,
  };

  return <Suspense fallback={fallback ?? defaultFallback[type]}>{children}</Suspense>;
}

/**
 * 页面加载边界
 */
export function PageSuspense({ children }: { children: ReactNode }) {
  return <SuspenseBoundary type="page">{children}</SuspenseBoundary>;
}

/**
 * 组件加载边界
 */
export function ComponentSuspense({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <SuspenseBoundary type="component" className={className}>
      {children}
    </SuspenseBoundary>
  );
}
