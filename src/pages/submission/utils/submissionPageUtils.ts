import type { Dispatch, SetStateAction } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { GlobalSolverConfig, InpSetInfo, SimTypeConfig, SubmissionFormValues } from '../types';
import type { SelectedSimType } from '../hooks';

export const toNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const getProjectHabitIds = (userKey: string, storageKey: string): number[] => {
  if (!userKey) return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    return Array.isArray(parsed?.[userKey]) ? parsed[userKey] : [];
  } catch {
    return [];
  }
};

export const getPreferredProjectId = (
  projects: Array<{ id: number }>,
  preferredIds: number[]
): number | null => {
  if (projects.length === 0) return null;
  for (const id of preferredIds) {
    if (projects.some(project => project.id === id)) return id;
  }
  return projects[0].id;
};

export const updateProjectHabit = (
  userKey: string,
  projectId: number | null | undefined,
  storageKey: string
) => {
  if (!userKey || projectId == null) return;
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
    const current = Array.isArray(parsed[userKey]) ? parsed[userKey] : [];
    parsed[userKey] = [projectId, ...current.filter(id => id !== projectId)].slice(0, 10);
    localStorage.setItem(storageKey, JSON.stringify(parsed));
  } catch {
    // ignore
  }
};

interface RestoreOrderSnapshotOptions {
  order: Record<string, unknown>;
  form: UseFormReturn<SubmissionFormValues>;
  findConditionId: (foldTypeId: number, simTypeId: number) => number | null;
  clearInitializedConditionIds: () => void;
  setSelectedSimTypes: (selected: SelectedSimType[]) => void;
  markConditionIdsAsInitialized: (ids: number[]) => void;
  setSimTypeConfigs: Dispatch<SetStateAction<Record<number, SimTypeConfig>>>;
  setGlobalSolver: Dispatch<SetStateAction<GlobalSolverConfig>>;
  setGlobalParams: Dispatch<SetStateAction<{ applyToAll: boolean; rotateDropFlag: boolean }>>;
  setInpSets: Dispatch<SetStateAction<InpSetInfo[]>>;
  defaultGlobalSolver: GlobalSolverConfig;
}

export const restoreOrderSnapshot = ({
  order,
  form,
  findConditionId,
  clearInitializedConditionIds,
  setSelectedSimTypes,
  markConditionIdsAsInitialized,
  setSimTypeConfigs,
  setGlobalSolver,
  setGlobalParams,
  setInpSets,
  defaultGlobalSolver,
}: RestoreOrderSnapshotOptions) => {
  const rawInput = order.inputJson ?? order.input_json;
  const inputJson =
    typeof rawInput === 'string'
      ? ((JSON.parse(rawInput) as Record<string, unknown>) ?? {})
      : ((rawInput as Record<string, unknown>) ?? {});

  const projectInfo =
    ((inputJson.projectInfo || inputJson.project_info) as Record<string, unknown>) ?? {};
  const rawConditions = inputJson.conditions;
  const conditions = Array.isArray(rawConditions)
    ? rawConditions
    : rawConditions && typeof rawConditions === 'object'
      ? Object.values(rawConditions as Record<string, unknown>)
      : [];

  const foldTypeIdsFromInput = conditions
    .map(c =>
      toNumber(
        (c as Record<string, unknown>).foldTypeId ?? (c as Record<string, unknown>).fold_type_id
      )
    )
    .filter((n): n is number => n != null);
  const simTypeIdsFromInput = conditions
    .map(c =>
      toNumber(
        (c as Record<string, unknown>).simTypeId ?? (c as Record<string, unknown>).sim_type_id
      )
    )
    .filter((n): n is number => n != null);

  const foldTypeIds =
    (Array.isArray(order.foldTypeIds) ? order.foldTypeIds : order.fold_type_ids) ??
    foldTypeIdsFromInput;
  const simTypeIds =
    (Array.isArray(order.simTypeIds) ? order.simTypeIds : order.sim_type_ids) ??
    simTypeIdsFromInput;

  form.reset({
    projectId: toNumber(order.projectId ?? order.project_id) as unknown as number,
    phaseId: toNumber(
      order.phaseId ?? order.phase_id ?? projectInfo.phaseId ?? projectInfo.phase_id
    ),
    issueTitle: String(projectInfo.issueTitle ?? projectInfo.issue_title ?? ''),
    modelLevelId: toNumber(order.modelLevelId ?? order.model_level_id) ?? 1,
    originFile: {
      type:
        toNumber(
          order.originFileType ??
            order.origin_file_type ??
            (order.originFile as Record<string, unknown> | undefined)?.type
        ) ?? 1,
      path: String(
        (order.originFile as Record<string, unknown> | undefined)?.path ??
          order.originFilePath ??
          order.origin_file_path ??
          ''
      ),
      name: String(
        (order.originFile as Record<string, unknown> | undefined)?.name ??
          order.originFileName ??
          order.origin_file_name ??
          ''
      ),
      verified: true,
    },
    originFoldTypeId: toNumber(order.originFoldTypeId ?? order.origin_fold_type_id),
    participantIds: Array.isArray(order.participantIds) ? (order.participantIds as string[]) : [],
    foldTypeIds: Array.isArray(foldTypeIds) ? (foldTypeIds as number[]) : [],
    remark: String(order.remark ?? projectInfo.remark ?? ''),
    simTypeIds: Array.isArray(simTypeIds) ? (simTypeIds as number[]) : [],
  });

  const selected: SelectedSimType[] = [];
  const configs: Record<number, SimTypeConfig> = {};
  const initializedConditionIds: number[] = [];

  if (conditions.length > 0) {
    conditions.forEach(item => {
      const c = item as Record<string, unknown>;
      const foldTypeId = toNumber(c.foldTypeId ?? c.fold_type_id);
      const simTypeId = toNumber(c.simTypeId ?? c.sim_type_id);
      if (foldTypeId == null || simTypeId == null) return;
      const conditionId =
        toNumber(c.conditionId ?? c.condition_id) ?? findConditionId(foldTypeId, simTypeId);
      if (conditionId == null) return;
      selected.push({ conditionId, foldTypeId, simTypeId });

      if (c.params && c.output && c.solver) {
        configs[conditionId] = {
          conditionId,
          foldTypeId,
          simTypeId,
          params: c.params as SimTypeConfig['params'],
          output: c.output as SimTypeConfig['output'],
          solver: c.solver as SimTypeConfig['solver'],
          careDeviceIds: Array.isArray(c.careDeviceIds)
            ? (c.careDeviceIds as string[])
            : Array.isArray(c.care_device_ids)
              ? (c.care_device_ids as string[])
              : [],
          conditionRemark:
            typeof c.remark === 'string'
              ? c.remark
              : typeof c.conditionRemark === 'string'
                ? c.conditionRemark
                : typeof c.condition_remark === 'string'
                  ? c.condition_remark
                  : '',
        };
        initializedConditionIds.push(conditionId);
      }
    });
  } else if (order.optParam && typeof order.optParam === 'object') {
    const legacyOpt = order.optParam as Record<string, unknown>;
    const foldIds = Array.isArray(foldTypeIds) ? (foldTypeIds as number[]) : [];
    const simIds = Array.isArray(simTypeIds) ? (simTypeIds as number[]) : [];
    foldIds.forEach(foldTypeId => {
      simIds.forEach(simTypeId => {
        const conditionId = findConditionId(foldTypeId, simTypeId);
        if (conditionId == null) return;
        selected.push({ conditionId, foldTypeId, simTypeId });
        const oldCfg = legacyOpt[String(simTypeId)] as Record<string, unknown> | undefined;
        if (oldCfg) {
          configs[conditionId] = {
            conditionId,
            foldTypeId,
            simTypeId,
            params: (oldCfg.params as SimTypeConfig['params']) ?? {
              mode: 'template',
              templateSetId: null,
              templateItemId: null,
              algorithm: 'doe',
              customValues: {},
            },
            output: (oldCfg.output as SimTypeConfig['output']) ?? {
              mode: 'template',
              outputSetId: null,
              selectedConditionIds: [],
              conditionValues: {},
              selectedOutputIds: [],
            },
            solver: (oldCfg.solver as SimTypeConfig['solver']) ?? defaultGlobalSolver,
            careDeviceIds: [],
            conditionRemark: '',
          };
          initializedConditionIds.push(conditionId);
        }
      });
    });
  }

  clearInitializedConditionIds();
  setSelectedSimTypes(selected);
  if (initializedConditionIds.length > 0) {
    markConditionIdsAsInitialized(initializedConditionIds);
  }
  setSimTypeConfigs(configs);
  setGlobalSolver((inputJson.globalSolver as GlobalSolverConfig) || defaultGlobalSolver);
  setGlobalParams(
    (inputJson.globalParams as { applyToAll: boolean; rotateDropFlag: boolean }) || {
      applyToAll: false,
      rotateDropFlag: false,
    }
  );
  setInpSets(Array.isArray(inputJson.inpSets) ? (inputJson.inpSets as InpSetInfo[]) : []);
};
