/**
 * 画布导出功能 Hook
 * 支持导出高清PNG图片和流程图JSON文件
 *
 * 核心难点：画布使用 CSS transform(translate+scale) + position:absolute 子节点，
 * 容器无显式宽高。
 *
 * 解决方案：利用 html2canvas 的 onclone 回调。
 * html2canvas 内部会克隆整个 Document（完整保留所有样式表 + CSS 变量），
 * 我们在 onclone 中修正克隆元素的 transform / position / overflow / 尺寸，
 * 不修改页面上的活 DOM，零闪烁。
 */
import { useCallback } from 'react';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  scale?: number;
  backgroundColor?: string;
  filename?: string;
  /** 内容区域内边距（px），默认 40 */
  padding?: number;
}

export interface FlowData {
  version: string;
  exportTime: string;
  project: {
    id: number | null;
    name: string;
  };
  foldTypes: Array<{
    id: number;
    name: string;
  }>;
  simTypes: Array<{
    id: number;
    foldTypeId: number;
    name: string;
    isDefault: boolean;
    config?: {
      params: unknown;
      output: unknown;
      solver: unknown;
    };
  }>;
}

/**
 * 通过读取子元素的 inline style.left/top + offsetWidth/offsetHeight
 * 计算画布内容的真实边界。
 *
 * 这些值不受祖先 CSS transform 的影响：
 * - style.left/top 是写死的画布坐标（如 120px, 560px）
 * - offsetWidth/offsetHeight 是元素自身的布局尺寸
 */
function calculateCanvasBounds(container: HTMLElement, padding: number) {
  let maxRight = 0;
  let maxBottom = 0;

  container.querySelectorAll('[style]').forEach(el => {
    const htmlEl = el as HTMLElement;
    const left = parseFloat(htmlEl.style.left);
    const top = parseFloat(htmlEl.style.top);

    if (!isNaN(left) && !isNaN(top) && htmlEl.offsetWidth > 0) {
      maxRight = Math.max(maxRight, left + htmlEl.offsetWidth);
      maxBottom = Math.max(maxBottom, top + htmlEl.offsetHeight);
    }
  });

  return {
    width: Math.max(Math.ceil(maxRight) + padding, 800),
    height: Math.max(Math.ceil(maxBottom) + padding, 600),
  };
}

export const useCanvasExport = () => {
  /**
   * 导出画布为高清PNG图片
   *
   * 利用 html2canvas 的 onclone 回调：
   * 1. 先从原始 DOM 计算内容边界（读取 inline style，不受 transform 影响）
   * 2. html2canvas 内部克隆整个 Document（含完整样式表 + CSS 变量）
   * 3. 在 onclone 回调中修正克隆元素的 transform/position/overflow/尺寸/SVG
   * 4. html2canvas 对修正后的克隆渲染截图
   * 5. 触发下载
   * 全程不修改页面活 DOM。
   */
  const exportAsImage = useCallback(
    async (canvasRef: HTMLElement | null, options: ExportOptions = {}): Promise<boolean> => {
      if (!canvasRef) {
        console.error('Canvas element not found');
        return false;
      }

      const {
        scale = 2,
        backgroundColor = '#ffffff',
        filename = 'submission-flow',
        padding = 40,
      } = options;

      try {
        // 1. 从原始 DOM 计算画布内容边界
        const bounds = calculateCanvasBounds(canvasRef, padding);

        // 2. 调用 html2canvas，在 onclone 中修正克隆 DOM 的布局
        const canvas = await html2canvas(canvasRef, {
          scale,
          backgroundColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: bounds.width,
          height: bounds.height,
          scrollX: 0,
          scrollY: 0,
          onclone: (_doc: Document, clonedEl: HTMLElement) => {
            // 移除 CSS transform（消除 translate + scale）
            clonedEl.style.transform = 'none';
            clonedEl.style.transition = 'none';
            // 改为 relative 定位，作为子元素的定位上下文
            clonedEl.style.position = 'relative';
            // 设置显式宽高
            clonedEl.style.width = `${bounds.width}px`;
            clonedEl.style.height = `${bounds.height}px`;

            // 解除父级 overflow:hidden 裁剪
            const parent = clonedEl.parentElement;
            if (parent) {
              parent.style.overflow = 'visible';
              parent.style.width = `${bounds.width}px`;
              parent.style.height = `${bounds.height}px`;
              parent.style.position = 'relative';
            }

            // 给 SVG 连接线设置显式宽高
            // ConnectionLine 的 <svg> 无 width/height + overflow:visible，
            // html2canvas 无法渲染无尺寸 SVG
            clonedEl.querySelectorAll('svg').forEach(svg => {
              svg.style.width = `${bounds.width}px`;
              svg.style.height = `${bounds.height}px`;
            });
          },
        });

        // 3. 触发下载
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
