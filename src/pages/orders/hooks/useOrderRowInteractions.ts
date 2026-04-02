import { useCallback, useRef } from 'react';
import type { OrderListItem } from '@/types/order';

interface UseOrderRowInteractionsOptions {
  onOpenResult?: (orderId: number) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const COPY_TOAST_INTERVAL = 1200;
const ROW_CLICK_DELAY = 220;

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

export const useOrderRowInteractions = ({
  onOpenResult,
  showToast,
}: UseOrderRowInteractionsOptions) => {
  const clickTimerRef = useRef<number | null>(null);
  const lastToastRef = useRef<{ message: string; time: number } | null>(null);

  const showThrottledToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
      const now = Date.now();
      if (
        lastToastRef.current &&
        lastToastRef.current.message === message &&
        now - lastToastRef.current.time < COPY_TOAST_INTERVAL
      ) {
        return;
      }
      lastToastRef.current = { message, time: now };
      showToast(type, message);
    },
    [showToast]
  );

  const openResult = useCallback(
    (orderId: number) => {
      if (onOpenResult) {
        onOpenResult(orderId);
        return;
      }
      window.open(`/#/results/${orderId}`, '_blank');
    },
    [onOpenResult]
  );

  const handleRowClick = useCallback(
    (order: OrderListItem) => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
      }

      clickTimerRef.current = window.setTimeout(async () => {
        clickTimerRef.current = null;
        const baseDir = order.baseDir?.trim();
        if (!baseDir) {
          showThrottledToast('info', '该申请单暂无工作目录');
          return;
        }

        try {
          await copyText(baseDir);
          showThrottledToast('success', '工作目录已复制到剪贴板');
        } catch {
          showThrottledToast('error', '复制工作目录失败');
        }
      }, ROW_CLICK_DELAY);
    },
    [showThrottledToast]
  );

  const handleRowDoubleClick = useCallback(
    (order: OrderListItem) => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      openResult(order.id);
    },
    [openResult]
  );

  return {
    openResult,
    handleRowClick,
    handleRowDoubleClick,
  };
};
