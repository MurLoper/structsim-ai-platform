import { useQuery } from '@tanstack/react-query';
import { rbacApi } from '@/api';
import { useAuthStore } from '@/stores';
import type { User } from '@/types';
import { normalizeOrderUser } from '../utils/orderUsers';

export function useOrderUsers() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['orders', 'users'] as const,
    queryFn: async () => {
      const response = await rbacApi.getUsers();
      return Array.isArray(response?.data)
        ? (response.data as User[]).map(user => normalizeOrderUser(user))
        : [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
}
