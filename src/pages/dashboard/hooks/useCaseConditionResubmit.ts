import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api';
import { queryKeys } from '@/lib/queryClient';

interface UseCaseConditionResubmitOptions {
  orderId: number | null;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useCaseConditionResubmit = ({
  orderId,
  onSuccess,
  onError,
}: UseCaseConditionResubmitOptions) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (caseConditionId: number) => ordersApi.resubmitCaseCondition(caseConditionId),
    onSuccess: () => {
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
        void queryClient.invalidateQueries({ queryKey: ['results', 'orderCaseResults', orderId] });
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
