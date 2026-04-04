import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ordersApi } from '@/api';
import { queryClient, queryKeys } from '@/lib/queryClient';
import {
  trackSubmissionSubmitFailure,
  trackSubmissionSubmitSuccess,
} from '@/features/platform/tracking/domains/submissionTracking';
import type { InpSetInfo, SubmissionFormValues } from '../types';
import { useSubmissionState } from './useSubmissionState';

type SubmissionState = ReturnType<typeof useSubmissionState>;

interface UseSubmissionSubmitHandlerOptions {
  form: UseFormReturn<SubmissionFormValues>;
  state: SubmissionState;
  submitRounds: number;
  orderId: number | null;
  isEditMode: boolean;
  language: string;
  inpSets: InpSetInfo[];
  user: {
    id?: number | string | null;
    domainAccount?: string | null;
    maxBatchSize?: number | null;
    dailyRoundLimit?: number | null;
  } | null;
  t: (key: string) => string;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  openProjectDrawer: () => void;
  navigateToOrders: () => void;
  onClose?: () => void;
  clearDraft: () => void;
}

export const useSubmissionSubmitHandler = ({
  form,
  state,
  submitRounds,
  orderId,
  isEditMode,
  language,
  inpSets,
  user,
  t,
  showToast,
  openProjectDrawer,
  navigateToOrders,
  onClose,
  clearDraft,
}: UseSubmissionSubmitHandlerOptions) => {
  const conditions = useMemo(
    () =>
      state.selectedSimTypes.map(item => {
        const config = state.simTypeConfigs[item.conditionId];
        const foldType = state.safeFoldTypes.find(ft => ft.id === item.foldTypeId);
        const simType = state.safeSimTypes.find(st => st.id === item.simTypeId);
        return {
          conditionId: item.conditionId,
          foldTypeId: item.foldTypeId,
          foldTypeName: foldType?.name,
          simTypeId: item.simTypeId,
          simTypeName: simType?.name,
          params: config?.params,
          output: config?.output,
          solver: config?.solver,
          careDeviceIds: config?.careDeviceIds || [],
          remark: config?.conditionRemark || '',
        };
      }),
    [state.safeFoldTypes, state.safeSimTypes, state.selectedSimTypes, state.simTypeConfigs]
  );

  const handleSubmit = form.handleSubmit(
    async values => {
      try {
        const limitResponse = await ordersApi.getSubmitLimits();
        const limitData = limitResponse?.data;

        const latestSubmitMeta = {
          maxBatchSize: limitData?.maxBatchSize ?? user?.maxBatchSize ?? 200,
          dailyRoundLimit: limitData?.dailyRoundLimit ?? user?.dailyRoundLimit ?? 500,
          todayUsedRounds: limitData?.todayUsedRounds ?? 0,
        };

        if (submitRounds > latestSubmitMeta.maxBatchSize) {
          showToast(
            'error',
            `本次提单轮次 ${submitRounds} 超过上限 ${latestSubmitMeta.maxBatchSize}`
          );
          return;
        }

        if (latestSubmitMeta.todayUsedRounds + submitRounds > latestSubmitMeta.dailyRoundLimit) {
          showToast(
            'error',
            `今日轮次上限 ${latestSubmitMeta.dailyRoundLimit}，已用 ${latestSubmitMeta.todayUsedRounds}，本次需 ${submitRounds}`
          );
          return;
        }

        const originFile = {
          type: values.originFile.type,
          path: values.originFile.path,
          name: values.originFile.name,
          fileId:
            values.originFile.type === 2 ? Number(values.originFile.path || '') || null : null,
        };

        const payload = {
          projectId: values.projectId!,
          phaseId: values.phaseId ?? null,
          modelLevelId: values.modelLevelId,
          originFile,
          originFoldTypeId: values.originFoldTypeId ?? null,
          participantIds: values.participantIds,
          remark: values.remark,
          inputJson: {
            version: 2,
            projectInfo: {
              projectId: values.projectId!,
              phaseId: values.phaseId ?? null,
              projectName: state.projects.find(project => project.id === values.projectId)?.name,
              modelLevelId: values.modelLevelId,
              originFile: values.originFile,
              originFoldTypeId: values.originFoldTypeId ?? null,
              participantIds: values.participantIds,
              issueTitle: values.issueTitle,
              remark: values.remark,
            },
            conditions,
            globalSolver: state.globalSolver,
            inpSets,
          },
          clientMeta: { lang: language },
        };

        if (isEditMode && orderId) {
          await ordersApi.updateOrder(orderId, payload);
          showToast('success', t('sub.update_success'));
        } else {
          await ordersApi.createOrder(payload);
          trackSubmissionSubmitSuccess(values.projectId!, conditions.length, submitRounds);
          showToast('success', t('sub.submit_success'));
          clearDraft();
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
        if (onClose) onClose();
        else navigateToOrders();
      } catch (error) {
        console.error('提交订单失败:', error);
        const message = (error as { message?: string })?.message || t('sub.submit_fail');
        trackSubmissionSubmitFailure(values.projectId, message);
        showToast('error', message);
      }
    },
    errors => {
      if (errors.projectId || errors.originFile || errors.foldTypeIds || errors.remark) {
        openProjectDrawer();
        requestAnimationFrame(() => {
          if (errors.projectId) {
            form.setFocus('projectId');
            return;
          }
          if (errors.originFile?.path) {
            form.setFocus('originFile.path');
            return;
          }
          if (errors.originFile?.name) {
            form.setFocus('originFile.name');
          }
        });
      }
    }
  );

  return { conditions, handleSubmit };
};
