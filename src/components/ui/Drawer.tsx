/**
 * Drawer - 抽屉面板组件
 *
 * 参考 Element UI el-drawer / Ant Design Drawer
 * 支持左右方向、可拖拽调整宽度、动画过渡
 *
 * @example
 * ```tsx
 * <Drawer open={isOpen} onClose={close} title="配置参数" width="lg">
 *   <p>抽屉内容</p>
 * </Drawer>
 *
 * <Drawer open={isOpen} onClose={close} title="详情" placement="left" resizable>
 *   <p>可拖拽宽度</p>
 * </Drawer>
 * ```
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 子内容 */
  children: React.ReactNode;
  /** 方向 */
  placement?: 'left' | 'right';
  /** 预设宽度 */
  width?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** 是否可拖拽调整宽度 */
  resizable?: boolean;
  /** 最小宽度(px) */
  minWidth?: number;
  /** 最大宽度(px) */
  maxWidth?: number;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 底部内容 */
  footer?: React.ReactNode;
  /** 容器类名 */
  className?: string;
  /** 内容区类名 */
  bodyClassName?: string;
}

const widthMap = {
  sm: 360,
  md: 480,
  lg: 640,
  xl: 800,
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  placement = 'right',
  width = 'md',
  resizable = false,
  minWidth = 320,
  maxWidth = 1200,
  mask = true,
  maskClosable = true,
  closable = true,
  footer,
  className,
  bodyClassName,
}) => {
  const defaultWidth = typeof width === 'number' ? width : widthMap[width];
  const [drawerWidth, setDrawerWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrawerWidth(defaultWidth);
  }, [defaultWidth]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable) return;
      e.preventDefault();
      setIsResizing(true);
    },
    [resizable]
  );

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = placement === 'right' ? window.innerWidth - e.clientX : e.clientX;
      setDrawerWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };
    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, placement]);

  // 阻止 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isRight = placement === 'right';

  return (
    <>
      {/* 遮罩 */}
      {mask && open && (
        <div
          className={cn(
            'fixed inset-0 bg-black/30 z-40 transition-opacity',
            isResizing && 'cursor-ew-resize'
          )}
          onClick={maskClosable && !isResizing ? onClose : undefined}
        />
      )}
      {/* 抽屉 */}
      <div
        ref={drawerRef}
        style={resizable ? { width: `${drawerWidth}px` } : undefined}
        className={cn(
          'fixed top-0 h-full bg-card shadow-2xl z-50 flex flex-col',
          isRight ? 'right-0' : 'left-0',
          !resizable &&
            (typeof width === 'number'
              ? ''
              : {
                  sm: 'w-[360px]',
                  md: 'w-[480px]',
                  lg: 'w-[640px]',
                  xl: 'w-[800px]',
                }[width as string]),
          !isResizing && 'transition-transform duration-300',
          open ? 'translate-x-0' : isRight ? 'translate-x-full' : '-translate-x-full',
          className
        )}
      >
        {/* 拖拽手柄 */}
        {resizable && open && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute top-0 w-1 h-full cursor-ew-resize z-10',
              'hover:bg-primary/50 transition-colors',
              isResizing ? 'bg-primary/50' : 'bg-transparent',
              isRight ? 'left-0' : 'right-0'
            )}
          />
        )}
        {/* 头部 */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {closable && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-auto"
              >
                <XMarkIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
        {/* 内容 */}
        <div className={cn('flex-1 overflow-y-auto p-4', bodyClassName)}>{children}</div>
        {/* 底部 */}
        {footer && <div className="shrink-0 p-4 border-t border-border">{footer}</div>}
      </div>
    </>
  );
};
Drawer.displayName = 'Drawer';
