import React from 'react';
import type { useForm } from 'react-hook-form';

import { ordersApi } from '@/api';
import type { CareDevice } from '@/types/config';
import type { useSubmissionState } from '../hooks/useSubmissionState';
import type { InpSetInfo, SubmissionFormValues } from '../types';
import {
  ProjectDrawerContent,
  ParamsDrawerContent,
  OutputDrawerContent,
  SolverDrawerContent,
  CareDevicesDrawerContent,
} from './index';

type SubmissionState = ReturnType<typeof useSubmissionState>;
type SubmissionForm = ReturnType<typeof useForm<SubmissionFormValues>>;

interface SubmissionDrawerContentProps {
  form: SubmissionForm;
  state: SubmissionState;
  configCareDevices: CareDevice[];
  inpSets: InpSetInfo[];
  setInpSets: React.Dispatch<React.SetStateAction<InpSetInfo[]>>;
  t: (key: string) => string;
  userMaxCpuCores?: number | null;
  submitLimitMaxCpuCores?: number | null;
}

export const SubmissionDrawerContent: React.FC<SubmissionDrawerContentProps> = ({
  form,
  state,
  configCareDevices,
  inpSets,
  setInpSets,
  t,
  userMaxCpuCores,
  submitLimitMaxCpuCores,
}) => {
  if (state.drawerMode === 'project') {
    return (
      <ProjectDrawerContent
        projects={state.projects}
        phases={state.projectPhases}
        foldTypes={state.safeFoldTypes}
        users={state.users}
        control={form.control}
        setValue={form.setValue}
        t={t}
        onVerifyFile={async (filePath, fileType) => {
          try {
            const resp = await ordersApi.verifyFile(filePath, fileType);
            const result = resp.data ?? resp;
            if (result.success) {
              const parsedSets: InpSetInfo[] = (result.inpSets || []).map(
                (s: { type: string; name: string }) => ({
                  type: s.type as InpSetInfo['type'],
                  name: s.name,
                })
              );
              setInpSets(parsedSets);
              return {
                success: true,
                name: result.name || filePath.split(/[/\\]/).pop() || filePath,
                path: result.path || filePath,
                inpSets: parsedSets.length > 0 ? parsedSets : undefined,
              };
            }
            return { success: false, error: result.error || t('sub.file_verify_fail') };
          } catch (err) {
            const msg = (err as { message?: string })?.message || t('sub.verify_request_fail');
            return { success: false, error: msg };
          }
        }}
      />
    );
  }

  if (state.activeConditionId && state.simTypeConfigs[state.activeConditionId]) {
    const activeConfig = state.simTypeConfigs[state.activeConditionId];
    const activeConditionConfig =
      state.activeFoldTypeId && state.activeSimTypeId
        ? state.getConditionConfig(state.activeFoldTypeId, state.activeSimTypeId)
        : undefined;

    if (state.drawerMode === 'params') {
      return (
        <ParamsDrawerContent
          config={activeConfig}
          simTypeId={state.activeSimTypeId!}
          paramDefs={state.safeParamDefs}
          paramGroups={state.safeParamGroups}
          conditionConfig={activeConditionConfig}
          onUpdate={updates => state.updateSimTypeConfig(state.activeConditionId!, updates)}
          onFetchGroupParams={state.fetchParamGroupParams}
          t={t}
        />
      );
    }

    if (state.drawerMode === 'output') {
      return (
        <OutputDrawerContent
          config={activeConfig}
          simTypeId={state.activeSimTypeId!}
          outputSets={state.safeOutputSets}
          conditionConfig={activeConditionConfig}
          inpSets={inpSets}
          onUpdate={updates => state.updateSimTypeConfig(state.activeConditionId!, updates)}
          onFetchGroupOutputs={state.fetchOutputGroupOutputs}
          t={t}
        />
      );
    }

    if (state.drawerMode === 'solver') {
      return (
        <SolverDrawerContent
          config={activeConfig}
          solvers={state.safeSolvers}
          resourcePools={state.resourcePools}
          globalSolver={state.globalSolver}
          maxCpuCores={submitLimitMaxCpuCores ?? userMaxCpuCores ?? undefined}
          onUpdate={updates => state.updateSolverConfig(state.activeConditionId!, updates)}
          onGlobalSolverChange={state.setGlobalSolver}
          onApplyToAll={state.applySolverToAll}
          t={t}
        />
      );
    }

    if (state.drawerMode === 'careDevices') {
      return (
        <CareDevicesDrawerContent
          configCareDevices={configCareDevices}
          selectedDeviceIds={activeConfig.careDeviceIds || []}
          conditionRemark={activeConfig.conditionRemark || ''}
          onUpdate={deviceIds =>
            state.updateSimTypeConfig(state.activeConditionId!, { careDeviceIds: deviceIds })
          }
          onRemarkChange={remark =>
            state.updateSimTypeConfig(state.activeConditionId!, { conditionRemark: remark })
          }
          t={t}
        />
      );
    }
  }

  return (
    <div className="text-center text-slate-500 eyecare:text-muted-foreground py-8">
      请选择配置项
    </div>
  );
};
