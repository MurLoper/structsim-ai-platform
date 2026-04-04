import { useCallback } from 'react';
import { useSubmissionState } from './useSubmissionState';
import { trackSubmissionDrawerOpen } from '@/features/platform/tracking/domains/submissionTracking';

type SubmissionState = ReturnType<typeof useSubmissionState>;
type DrawerMode = SubmissionState['drawerMode'];

interface UseSubmissionDrawerActionsOptions {
  state: SubmissionState;
  conditionOrderMap: Map<number, number>;
  t: (key: string) => string;
}

export const useSubmissionDrawerActions = ({
  state,
  conditionOrderMap,
  t,
}: UseSubmissionDrawerActionsOptions) => {
  const openProjectDrawer = useCallback(() => {
    trackSubmissionDrawerOpen('project');
    state.setDrawerMode('project');
    state.setIsDrawerOpen(true);
  }, [state]);

  const openConditionDrawer = useCallback(
    (
      mode: Exclude<DrawerMode, 'project' | null>,
      conditionId: number,
      foldTypeId: number,
      simTypeId: number
    ) => {
      trackSubmissionDrawerOpen(mode, conditionId, foldTypeId, simTypeId);
      state.setActiveConditionId(conditionId);
      state.setActiveFoldTypeId(foldTypeId);
      state.setActiveSimTypeId(simTypeId);
      state.setDrawerMode(mode);
      state.setIsDrawerOpen(true);
    },
    [state]
  );

  const openParamsDrawer = useCallback(
    (conditionId: number, foldTypeId: number, simTypeId: number) =>
      openConditionDrawer('params', conditionId, foldTypeId, simTypeId),
    [openConditionDrawer]
  );

  const openOutputDrawer = useCallback(
    (conditionId: number, foldTypeId: number, simTypeId: number) =>
      openConditionDrawer('output', conditionId, foldTypeId, simTypeId),
    [openConditionDrawer]
  );

  const openSolverDrawer = useCallback(
    (conditionId: number, foldTypeId: number, simTypeId: number) =>
      openConditionDrawer('solver', conditionId, foldTypeId, simTypeId),
    [openConditionDrawer]
  );

  const openCareDevicesDrawer = useCallback(
    (conditionId: number, foldTypeId: number, simTypeId: number) =>
      openConditionDrawer('careDevices', conditionId, foldTypeId, simTypeId),
    [openConditionDrawer]
  );

  const getDrawerTitle = useCallback(() => {
    const foldType = state.safeFoldTypes.find(ft => ft.id === state.activeFoldTypeId);
    const simType = state.safeSimTypes.find(st => st.id === state.activeSimTypeId);
    const conditionOrder = state.activeConditionId
      ? conditionOrderMap.get(state.activeConditionId)
      : undefined;

    const prefix =
      foldType && simType
        ? `${t('sub.condition')}${conditionOrder ?? '-'}-${foldType.name}${simType.name} - `
        : '';

    switch (state.drawerMode) {
      case 'project':
        return t('sub.proj_select');
      case 'params':
        return `${prefix}${t('sub.params_config')}`;
      case 'output':
        return `${prefix}${t('sub.output_config')}`;
      case 'solver':
        return `${prefix}${t('sub.solver_config')}`;
      case 'careDevices':
        return `${prefix}${t('sub.care_devices')}`;
      default:
        return '';
    }
  }, [conditionOrderMap, state, t]);

  return {
    openProjectDrawer,
    openParamsDrawer,
    openOutputDrawer,
    openSolverDrawer,
    openCareDevicesDrawer,
    getDrawerTitle,
  };
};
