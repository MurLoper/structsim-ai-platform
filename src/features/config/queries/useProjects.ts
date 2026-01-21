/**
 * 项目配置 Query Hooks
 * 使用 TanStack Query 管理项目数据的服务端状态
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseConfigApi } from '@/api/config/base';
import { queryKeys } from '@/lib/queryClient';
import type { Project } from '@/types/config';

const toProjectPayload = (data: Partial<Project>) => {
  const payload: Record<string, unknown> = { ...data };
  if (data.defaultSimTypeId !== undefined) {
    payload.default_sim_type_id = data.defaultSimTypeId;
    delete payload.defaultSimTypeId;
  }
  if (data.defaultSolverId !== undefined) {
    payload.default_solver_id = data.defaultSolverId;
    delete payload.defaultSolverId;
  }
  return payload;
};

/**
 * 获取项目列表
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const response = await baseConfigApi.getProjects();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取单个项目详情
 */
export function useProject(id: number) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const response = await baseConfigApi.getProject(id);
      return response.data;
    },
    enabled: !!id && id > 0,
  });
}

/**
 * 创建项目
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Project>) =>
      baseConfigApi.createProject(toProjectPayload(data) as Partial<Project>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

/**
 * 更新项目
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
      baseConfigApi.updateProject(id, toProjectPayload(data) as Partial<Project>),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() });
    },
  });
}

/**
 * 删除项目
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => baseConfigApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
