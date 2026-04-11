import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api';
import { queryKeys } from '@/lib/queryClient';

interface UseOrderConditionResubmitOptions {
  orderId: number | null;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useOrderConditionResubmit = ({
  orderId,
  onSuccess,
  onError,
}: UseOrderConditionResubmitOptions) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderConditionId: number) => ordersApi.resubmitOrderCondition(orderConditionId),
    onSuccess: () => {
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
        void queryClient.invalidateQueries({ queryKey: ['results', 'orderConditions', orderId] });
        void queryClient.invalidateQueries({ queryKey: ['results', 'conditionRounds'] });
        void queryClient.invalidateQueries({ queryKey: ['results', 'focusedConditionAnalysis'] });
      }
      onSuccess?.();
    },
    onError,
  });

  return {
    resubmitCondition: mutation.mutate,
    isResubmittingCondition: mutation.isPending,
    resubmittingConditionId: mutation.variables ?? null,
  };
};
