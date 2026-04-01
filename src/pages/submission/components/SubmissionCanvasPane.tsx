import type React from 'react';
import { SubmissionQuickActions } from './SubmissionQuickActions';

interface SubmissionCanvasPaneProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  transform: { x: number; y: number; scale: number };
  activeConditionId: number | null;
  isDrawerOpen: boolean;
  activeMode: string;
  t: (key: string) => string;
  onWheel: React.WheelEventHandler<HTMLDivElement>;
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onMouseMove: React.MouseEventHandler<HTMLDivElement>;
  onMouseUp: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave: React.MouseEventHandler<HTMLDivElement>;
  onOpenMode: (mode: 'params' | 'output' | 'solver' | 'careDevices') => void;
  children: React.ReactNode;
}

export const SubmissionCanvasPane = ({
  containerRef,
  canvasContainerRef,
  transform,
  activeConditionId,
  isDrawerOpen,
  activeMode,
  t,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onOpenMode,
  children,
}: SubmissionCanvasPaneProps) => {
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={canvasContainerRef}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
        className="absolute transition-transform duration-75"
      >
        {children}
      </div>
      <SubmissionQuickActions
        isVisible={!!activeConditionId}
        isDrawerOpen={isDrawerOpen}
        activeMode={activeMode}
        t={t}
        onOpenMode={onOpenMode}
      />
    </div>
  );
};
