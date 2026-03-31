import React from 'react';
import { FolderIcon, CubeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { CANVAS_LAYOUT } from '@/constants/submission';
import type { useForm } from 'react-hook-form';

import type { SubmissionFormValues } from '../types';
import type { useSubmissionState } from '../hooks/useSubmissionState';
import { CanvasNode, ConnectionLine, SimTypeConfigBox } from './index';

type SubmissionState = ReturnType<typeof useSubmissionState>;
type SubmissionForm = ReturnType<typeof useForm<SubmissionFormValues>>;

interface SubmissionCanvasProps {
  form: SubmissionForm;
  state: SubmissionState;
  conditionOrderMap: Map<number, number>;
  originFile: { path?: string; name?: string };
  originFoldTypeId?: number | null;
  modelLevelId: number;
  participantIds: string[];
  t: (key: string) => string;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  openProjectDrawer: () => void;
  openParamsDrawer: (conditionId: number, foldTypeId: number, simTypeId: number) => void;
  openOutputDrawer: (conditionId: number, foldTypeId: number, simTypeId: number) => void;
  openSolverDrawer: (conditionId: number, foldTypeId: number, simTypeId: number) => void;
  openCareDevicesDrawer: (conditionId: number, foldTypeId: number, simTypeId: number) => void;
}

const {
  PROJECT_NODE_X,
  PROJECT_NODE_WIDTH,
  FOLD_TYPE_NODE_X,
  FOLD_TYPE_NODE_WIDTH,
  SIM_TYPE_NODE_X,
  SIM_TYPE_NODE_WIDTH,
  CONFIG_BOX_X,
  CONFIG_BOX_WIDTH,
  CONFIG_BOX_HEIGHT,
  SIM_TYPE_VERTICAL_SPACING,
  FOLD_TYPE_GAP,
  START_Y,
  LINE_OFFSET_Y,
} = CANVAS_LAYOUT;

export const SubmissionCanvas: React.FC<SubmissionCanvasProps> = ({
  form,
  state,
  conditionOrderMap,
  originFile,
  originFoldTypeId,
  modelLevelId,
  participantIds,
  t,
  showToast,
  openProjectDrawer,
  openParamsDrawer,
  openOutputDrawer,
  openSolverDrawer,
  openCareDevicesDrawer,
}) => {
  return (
    <>
      <CanvasNode
        title={state.selectedProject ? state.selectedProject.name : t('sub.sel_project')}
        x={PROJECT_NODE_X}
        y={state.getProjectNodeY()}
        width={PROJECT_NODE_WIDTH}
        icon={<FolderIcon className="w-6 h-6" />}
        isActive={!!state.selectedProject}
        isComplete={!!state.selectedProject && !!(originFile.path || originFile.name)}
        onClick={openProjectDrawer}
      >
        {state.selectedProject ? (
          <div className="text-xs text-slate-500 eyecare:text-muted-foreground space-y-1 bg-slate-50 dark:bg-slate-900/50 eyecare:bg-muted/50 p-2 rounded">
            <div className="flex justify-between">
              <span>{t('sub.source_file_label')}:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 eyecare:text-foreground truncate max-w-[180px]">
                {originFile.path || originFile.name || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('sub.origin_fold_type')}:</span>
              <span className="font-medium">
                {originFoldTypeId != null
                  ? state.safeFoldTypes.find(f => f.id === originFoldTypeId)?.name || '-'
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('sub.model_level')}:</span>
              <span className="font-medium">
                {modelLevelId === 1 ? t('sub.model_level_whole') : t('sub.model_level_part')}
              </span>
            </div>
            {participantIds.length > 0 && (
              <div className="flex justify-between">
                <span>{t('sub.participants')}:</span>
                <span className="font-medium">
                  {participantIds.length}
                  {t('sub.person_unit')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-400 eyecare:text-muted-foreground text-center italic py-2">
            {t('sub.click_select_project')}
          </div>
        )}
      </CanvasNode>

      {state.foldTypesWithSimTypes.map((foldTypeData, foldIdx) => {
        const isFoldTypeSelected =
          form.getValues('foldTypeIds')?.includes(foldTypeData.id) ?? false;
        const simTypeCount = Math.max(foldTypeData.simTypes.length, 1);
        const prevFoldTypesSimCount = state.foldTypesWithSimTypes
          .slice(0, foldIdx)
          .reduce((sum, ft) => sum + Math.max(ft.simTypes.length, 1), 0);
        const baseY =
          START_Y + prevFoldTypesSimCount * SIM_TYPE_VERTICAL_SPACING + foldIdx * FOLD_TYPE_GAP;
        const simTypesHeight = (simTypeCount - 1) * SIM_TYPE_VERTICAL_SPACING;
        const foldTypeNodeY = baseY + simTypesHeight / 2;
        const projectNodeY = state.getProjectNodeY();

        return (
          <React.Fragment key={`fold-${foldTypeData.id}`}>
            <ConnectionLine
              x1={PROJECT_NODE_X + PROJECT_NODE_WIDTH}
              y1={projectNodeY + LINE_OFFSET_Y}
              x2={FOLD_TYPE_NODE_X}
              y2={foldTypeNodeY + LINE_OFFSET_Y}
              isActive={isFoldTypeSelected}
            />

            <CanvasNode
              title={foldTypeData.name}
              x={FOLD_TYPE_NODE_X}
              y={foldTypeNodeY}
              width={FOLD_TYPE_NODE_WIDTH}
              icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
              isActive={isFoldTypeSelected}
              onClick={() => {
                const currentIds = form.getValues('foldTypeIds') || [];
                if (currentIds.includes(foldTypeData.id)) {
                  if (currentIds.length > 1) {
                    form.setValue(
                      'foldTypeIds',
                      currentIds.filter(id => id !== foldTypeData.id)
                    );
                  }
                } else {
                  form.setValue('foldTypeIds', [...currentIds, foldTypeData.id]);
                }
              }}
            >
              <div className="text-xs text-slate-500 eyecare:text-muted-foreground text-center">
                <span
                  className={`px-2 py-1 rounded ${
                    isFoldTypeSelected
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30'
                      : 'bg-slate-100 dark:bg-slate-700 eyecare:bg-muted'
                  }`}
                >
                  {isFoldTypeSelected ? t('sub.selected') : t('sub.click_select')}
                </span>
              </div>
            </CanvasNode>

            {foldTypeData.simTypes.map((simType, simIdx) => {
              const simTypeNodeY = baseY + simIdx * SIM_TYPE_VERTICAL_SPACING;
              const isSimTypeSelected = state.selectedSimTypes.some(
                item => item.conditionId === simType.conditionId
              );
              const config = state.simTypeConfigs[simType.conditionId];

              return (
                <React.Fragment key={`sim-${simType.id}-${simType.conditionId}`}>
                  <ConnectionLine
                    x1={FOLD_TYPE_NODE_X + FOLD_TYPE_NODE_WIDTH}
                    y1={foldTypeNodeY + LINE_OFFSET_Y}
                    x2={SIM_TYPE_NODE_X}
                    y2={simTypeNodeY + LINE_OFFSET_Y}
                    isActive={isFoldTypeSelected && isSimTypeSelected}
                  />

                  <CanvasNode
                    title={simType.name}
                    x={SIM_TYPE_NODE_X}
                    y={simTypeNodeY}
                    width={SIM_TYPE_NODE_WIDTH}
                    icon={<CubeIcon className="w-6 h-6" />}
                    isActive={isFoldTypeSelected && isSimTypeSelected}
                    onClick={() => {
                      if (!isFoldTypeSelected) {
                        const currentIds = form.getValues('foldTypeIds') || [];
                        form.setValue('foldTypeIds', [...currentIds, foldTypeData.id]);
                      }

                      const currentFoldTypeIds = form.getValues('foldTypeIds') || [];
                      const result = state.toggleSimType(
                        simType.conditionId,
                        foldTypeData.id,
                        simType.id,
                        currentFoldTypeIds
                      );

                      if (result === -1) {
                        showToast('warning', t('sub.keep_at_least_one_sim_type'));
                      } else if (result !== null) {
                        form.setValue(
                          'foldTypeIds',
                          currentFoldTypeIds.filter(id => id !== result)
                        );
                      }
                    }}
                  >
                    <div className="text-xs text-slate-500 eyecare:text-muted-foreground text-center">
                      {simType.isDefault && (
                        <span className="px-1.5 py-0.5 mr-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                          {t('sub.default_tag')}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded ${
                          isFoldTypeSelected && isSimTypeSelected
                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30'
                            : 'bg-slate-100 dark:bg-slate-700 eyecare:bg-muted'
                        }`}
                      >
                        {isSimTypeSelected ? t('sub.selected') : t('sub.click_select')}
                      </span>
                    </div>
                  </CanvasNode>

                  {isFoldTypeSelected && isSimTypeSelected && config && (
                    <>
                      <ConnectionLine
                        x1={SIM_TYPE_NODE_X + SIM_TYPE_NODE_WIDTH}
                        y1={simTypeNodeY + LINE_OFFSET_Y}
                        x2={CONFIG_BOX_X}
                        y2={simTypeNodeY + CONFIG_BOX_HEIGHT / 2}
                        isActive
                      />
                      <div
                        className="absolute border-2 border-dashed border-slate-300 dark:border-slate-600 eyecare:border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/30 eyecare:bg-muted/30"
                        style={{
                          left: CONFIG_BOX_X,
                          top: simTypeNodeY,
                          width: CONFIG_BOX_WIDTH,
                          height: CONFIG_BOX_HEIGHT,
                        }}
                      >
                        <div className="absolute -top-3 left-4 px-2 bg-white dark:bg-slate-800 eyecare:bg-card text-xs text-slate-500 font-medium">
                          {t('sub.condition')}
                          {conditionOrderMap.get(simType.conditionId) ?? foldIdx + simIdx + 1}-
                          {foldTypeData.name}
                          {simType.name} {t('sub.config')}
                        </div>
                        <SimTypeConfigBox
                          simType={simType}
                          foldType={foldTypeData}
                          config={config}
                          solvers={state.safeSolvers}
                          globalSolver={state.globalSolver}
                          drawerMode={state.drawerMode}
                          activeSimTypeId={state.activeSimTypeId}
                          onOpenParams={() =>
                            openParamsDrawer(simType.conditionId, foldTypeData.id, simType.id)
                          }
                          onOpenOutput={() =>
                            openOutputDrawer(simType.conditionId, foldTypeData.id, simType.id)
                          }
                          onOpenSolver={() =>
                            openSolverDrawer(simType.conditionId, foldTypeData.id, simType.id)
                          }
                          onOpenCareDevices={() =>
                            openCareDevicesDrawer(simType.conditionId, foldTypeData.id, simType.id)
                          }
                          t={t}
                        />
                      </div>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};
