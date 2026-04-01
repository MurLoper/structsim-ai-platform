import { useState } from 'react';
import type { CanvasTransform } from '../types';

export const useSubmissionCanvasState = () => {
  const [transform, setTransform] = useState<CanvasTransform>({ x: 60, y: 60, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  return {
    transform,
    setTransform,
    isDragging,
    setIsDragging,
    startPan,
    setStartPan,
  };
};
