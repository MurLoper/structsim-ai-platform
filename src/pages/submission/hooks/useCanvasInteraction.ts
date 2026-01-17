import { useCallback } from 'react';
import type { CanvasTransform } from '../types';

interface UseCanvasInteractionProps {
  transform: CanvasTransform;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  startPan: { x: number; y: number };
  setStartPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const useCanvasInteraction = ({
  transform,
  setTransform,
  isDragging,
  setIsDragging,
  startPan,
  setStartPan,
}: UseCanvasInteractionProps) => {
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const scaleSensitivity = 0.001;
      const newScale = Math.min(Math.max(transform.scale - e.deltaY * scaleSensitivity, 0.3), 2);
      setTransform(prev => ({ ...prev, scale: newScale }));
    },
    [transform.scale, setTransform]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      }
    },
    [transform.x, transform.y, setIsDragging, setStartPan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setTransform(prev => ({
          ...prev,
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        }));
      }
    },
    [isDragging, startPan, setTransform]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  const resetView = useCallback(() => {
    setTransform({ x: 60, y: 60, scale: 0.85 });
  }, [setTransform]);

  const zoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }));
  }, [setTransform]);

  const zoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.3) }));
  }, [setTransform]);

  return {
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView,
    zoomIn,
    zoomOut,
  };
};
