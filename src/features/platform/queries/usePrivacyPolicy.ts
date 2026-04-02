import { useMutation, useQuery } from '@tanstack/react-query';
import { platformApi } from '@/api/platform';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';

export const usePrivacyPolicy = () => {
  const { isAuthenticated, token } = useAuthStore();
  const hasAuthToken = !!token && !!localStorage.getItem('auth_token');

  return useQuery({
    queryKey: queryKeys.platform.privacyPolicy(),
    queryFn: async () => {
      const response = await platformApi.getPrivacyPolicy();
      return response.data;
    },
    enabled: isAuthenticated && hasAuthToken,
    staleTime: 30000,
  });
};

export const useAcceptPrivacyPolicy = () =>
  useMutation({
    mutationFn: async (policyVersion?: string) => {
      const response = await platformApi.acceptPrivacyPolicy(policyVersion);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.bootstrap() });
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.privacyPolicy() });
    },
  });
