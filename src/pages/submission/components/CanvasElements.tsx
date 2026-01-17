import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// ============ 画布节点组件 ============
interface CanvasNodeProps {
  title: string;
  x: number;
  y: number;
  width?: number;
  icon?: React.ReactNode;
  isActive?: boolean;
  isSelected?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const CanvasNode: React.FC<CanvasNodeProps> = ({
  title,
  x,
  y,
  width = 280,
  icon,
  isActive,
  isSelected,
  isComplete,
  hasError,
  onClick,
  children,
}) => {
  const borderClass = isSelected
    ? 'border-brand-500 ring-4 ring-brand-500/20'
    : isComplete
      ? 'border-green-500'
      : hasError
        ? 'border-red-400'
        : isActive
          ? 'border-brand-400'
          : 'border-slate-200 dark:border-slate-700';

  return (
    <div
      className={`absolute bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 transition-all cursor-pointer
        ${borderClass} hover:shadow-xl hover:scale-[1.02]`}
      style={{ left: x, top: y, width }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${
              isComplete
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                : hasError
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                  : isActive
                    ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            {icon}
          </div>
          <div className="font-semibold text-slate-800 dark:text-white truncate flex-1">
            {title}
          </div>
          {isComplete && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
          {hasError && <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />}
        </div>
        {children}
      </div>
    </div>
  );
};

// ============ 连接线组件 ============
interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isActive?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ x1, y1, x2, y2, isActive }) => {
  const midX = (x1 + x2) / 2;
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      style={{ zIndex: -1 }}
    >
      <path
        d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
        stroke={isActive ? '#3b82f6' : '#cbd5e1'}
        strokeWidth={isActive ? 3 : 2}
        fill="none"
        strokeDasharray={isActive ? undefined : '5,5'}
      />
    </svg>
  );
};
