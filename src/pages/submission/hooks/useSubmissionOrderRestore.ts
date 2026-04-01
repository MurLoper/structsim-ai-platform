import { useEffect } from 'react';

interface UseSubmissionOrderRestoreOptions {
  isEditMode: boolean;
  isConfigLoading: boolean;
  hasInitializedRef: React.MutableRefObject<boolean>;
  orderDetail?: { data?: Record<string, unknown> } | undefined;
  applyOrderSnapshot: (order: Record<string, unknown>) => void;
}

export const useSubmissionOrderRestore = ({
  isEditMode,
  isConfigLoading,
  hasInitializedRef,
  orderDetail,
  applyOrderSnapshot,
}: UseSubmissionOrderRestoreOptions) => {
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (isConfigLoading) return;
    if (!isEditMode || !orderDetail?.data) return;

    applyOrderSnapshot(orderDetail.data);
    hasInitializedRef.current = true;
  }, [applyOrderSnapshot, hasInitializedRef, isConfigLoading, isEditMode, orderDetail]);
};
