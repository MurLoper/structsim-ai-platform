import React, { useState, useCallback, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'normal' | 'wide';
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'normal',
  resizable = false,
  minWidth = 400,
  maxWidth = 1200,
}) => {
  const defaultWidth = width === 'wide' ? 640 : 480;
  const [drawerWidth, setDrawerWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // 当 width prop 改变时更新宽度
  useEffect(() => {
    setDrawerWidth(defaultWidth);
  }, [defaultWidth]);

  // 处理拖拽开始
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable) return;
      e.preventDefault();
      setIsResizing(true);
    },
    [resizable]
  );

  // 处理拖拽移动
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setDrawerWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return (
    <>
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/30 z-40 ${isResizing ? 'cursor-ew-resize' : ''}`}
          onClick={isResizing ? undefined : onClose}
        />
      )}
      <div
        ref={drawerRef}
        style={{ width: resizable ? `${drawerWidth}px` : undefined }}
        className={`fixed top-0 right-0 h-full bg-white dark:bg-slate-800 eyecare:bg-card shadow-2xl z-50
          ${!resizable ? (width === 'wide' ? 'w-[640px]' : 'w-[480px]') : ''}
          transform ${isResizing ? '' : 'transition-transform duration-300'}
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* 左侧拖拽手柄 */}
        {resizable && isOpen && (
          <div
            onMouseDown={handleMouseDown}
            className={`absolute left-0 top-0 w-1 h-full cursor-ew-resize
              hover:bg-brand-500 transition-colors group z-10
              ${isResizing ? 'bg-brand-500' : 'bg-transparent hover:bg-brand-400'}`}
          >
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-3 h-8
              flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-0.5 h-6 bg-slate-400 rounded-full" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 eyecare:border-border">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white eyecare:text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 eyecare:hover:bg-muted rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)] custom-scrollbar">{children}</div>
      </div>
    </>
  );
};
