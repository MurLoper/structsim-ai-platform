import { useMutation, useQuery } from '@tanstack/react-query';
import { platformApi } from '@/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/stores';
import type { PlatformAnnouncementPayload, PlatformSettingsUpdatePayload } from '@/types';

export const usePlatformAdminContent = () => {
  const { isAuthenticated, token } = useAuthStore();
  const hasAuthToken = !!token && !!localStorage.getItem('auth_token');

  return useQuery({
    queryKey: queryKeys.platform.adminContent(),
    queryFn: async () => {
      const response = await platformApi.getAdminContent();
      return response.data;
    },
    enabled: isAuthenticated && hasAuthToken,
    staleTime: 30000,
  });
};

const invalidatePlatformQueries = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.platform.adminContent() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.platform.bootstrap() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.platform.privacyPolicy() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.platform.analyticsAll() }),
  ]);
};

export const useUpdatePlatformAdminContent = () =>
  useMutation({
    mutationFn: async (payload: PlatformSettingsUpdatePayload) => {
      const response = await platformApi.updateAdminContent(payload);
      return response.data;
    },
    onSuccess: invalidatePlatformQueries,
  });

export const useCreatePlatformAnnouncement = () =>
  useMutation({
    mutationFn: async (payload: PlatformAnnouncementPayload) => {
      const response = await platformApi.createAnnouncement(payload);
      return response.data;
    },
    onSuccess: invalidatePlatformQueries,
  });

export const useUpdatePlatformAnnouncement = () =>
  useMutation({
    mutationFn: async ({
      announcementId,
      payload,
    }: {
      announcementId: number;
      payload: PlatformAnnouncementPayload;
    }) => {
      const response = await platformApi.updateAnnouncement(announcementId, payload);
      return response.data;
    },
    onSuccess: invalidatePlatformQueries,
  });

export const useDeletePlatformAnnouncement = () =>
  useMutation({
    mutationFn: async (announcementId: number) => {
      await platformApi.deleteAnnouncement(announcementId);
      return announcementId;
    },
    onSuccess: invalidatePlatformQueries,
  });
