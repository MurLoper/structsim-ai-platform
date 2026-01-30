/**
 * 画布导出功能 Hook
 * 支持导出高清PNG图片和流程图JSON文件
 */
import { useCallback } from 'react';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  scale?: number;
  backgroundColor?: string;
  filename?: string;
}

export interface FlowData {
  version: string;
  exportTime: string;
  project: {
    id: number | null;
    name: string;
  };
  foldType: {
    id: number | null;
    name: string;
  };
  simTypes: Array<{
    id: number;
    name: string;
    isDefault: boolean;
    config?: {
      params: unknown;
      condOut: unknown;
      solver: unknown;
    };
  }>;
}

export const useCanvasExport = () => {
  /**
   * 导出画布为高清PNG图片
   */
  const exportAsImage = useCallback(
    async (canvasRef: HTMLElement | null, options: ExportOptions = {}): Promise<boolean> => {
      if (!canvasRef) {
        console.error('Canvas element not found');
        return false;
      }

      const { scale = 2, backgroundColor = '#ffffff', filename = 'submission-flow' } = options;

      try {
        const canvas = await html2canvas(canvasRef, {
          scale,
          backgroundColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        const link = document.createElement('a');
        link.download = `${filename}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        return true;
      } catch (error) {
        console.error('Export image failed:', error);
        return false;
      }
    },
    []
  );

  /**
   * 导出流程图数据为JSON文件
   */
  const exportAsFlowData = useCallback(
    (flowData: FlowData, filename = 'submission-flow'): boolean => {
      try {
        const dataStr = JSON.stringify(flowData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${filename}-${Date.now()}.json`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        console.error('Export flow data failed:', error);
        return false;
      }
    },
    []
  );

  return {
    exportAsImage,
    exportAsFlowData,
  };
};
