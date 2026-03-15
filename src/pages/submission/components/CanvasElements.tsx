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
    ? 'border-primary ring-4 ring-primary/20'
    : isComplete
      ? 'border-primary'
      : hasError
        ? 'border-destructive'
        : isActive
          ? 'border-primary/60'
          : 'border-border';

  return (
    <div
      className={`absolute bg-card rounded-xl shadow-lg border-2 transition-all cursor-pointer
        ${borderClass} hover:shadow-xl hover:scale-[1.02]`}
      style={{ left: x, top: y, width }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${
              isComplete
                ? 'bg-primary/10 text-primary'
                : hasError
                  ? 'bg-destructive/10 text-destructive'
                  : isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
            }`}
          >
            {icon}
          </div>
          <div className="font-semibold text-foreground truncate flex-1">{title}</div>
          {isComplete && <CheckCircleIcon className="w-5 h-5 text-primary" />}
          {hasError && <ExclamationTriangleIcon className="w-5 h-5 text-destructive" />}
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

// ============ 画布常量 ============
export const CANVAS_CONSTANTS = {
  NODE_WIDTH: 280,
  NODE_HEIGHT: 120,
  SPACING_X: 400,
  SPACING_Y: 200,
};
