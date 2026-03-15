import React, { useMemo } from 'react';
import { CogIcon, CheckCircleIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import type { SimTypeConfig, DrawerMode, GlobalSolverConfig } from '../types';
import { AlgorithmType } from '../types';
import type { Solver } from '@/api/config';

interface SimTypeConfigBoxProps {
  simType: { id: number; name: string };
  foldType: { id: number; name: string };
  foldTypeIndex: number; // 工况序号（从0开始）
  config: SimTypeConfig;
  solvers: Solver[];
  globalSolver: GlobalSolverConfig;
  drawerMode: DrawerMode;
  activeSimTypeId: number | null;
  onOpenParams: () => void;
  onOpenOutput: () => void;
  onOpenSolver: () => void;
  onOpenCareDevices: () => void;
  t?: (key: string) => string;
}

export const SimTypeConfigBox: React.FC<SimTypeConfigBoxProps> = ({
  simType,
  foldType: _foldType,
  foldTypeIndex: _foldTypeIndex,
  config,
  solvers,
  globalSolver,
  drawerMode,
  activeSimTypeId,
  onOpenParams,
  onOpenOutput,
  onOpenSolver,
  onOpenCareDevices,
  t = (key: string) => key,
}) => {
  // 格式化批次轮次显示
  const formatBatchRounds = useMemo(() => {
    const optParams = config.params.optParams;
    if (!optParams) return '-';

    const algType = optParams.algType;
    const batchSize = optParams.batchSize || [];
    const batchSizeType = optParams.batchSizeType ?? 1;
    const customBatchSize = optParams.customBatchSize || [];

    // DOE 模式：显示 DOE 数据的轮次数
    if (algType === AlgorithmType.DOE || algType === AlgorithmType.DOE_FILE) {
      const doeRounds = optParams.doeParamData?.length || 0;
      if (doeRounds > 0) {
        return `[${doeRounds}]`;
      }
      // 如果没有 DOE 数据，显示批次大小
      if (batchSize.length > 0) {
        return `[${batchSize[0]?.value || 0}]`;
      }
      return '-';
    }

    // 贝叶斯模式
    if (algType === AlgorithmType.BAYESIAN) {
      // 自定义批次模式
      if (batchSizeType === 2) {
        if (customBatchSize.length === 0) return '-';
        // 显示格式: [1-13:5, 14-19:5] 或缩略
        const items = customBatchSize.map(b => `${b.startIndex}-${b.endIndex}:${b.value}`);
        if (items.length <= 2) {
          return `[${items.join(', ')}]`;
        }
        return `[${items[0]}, ...+${items.length - 1}]`;
      }

      // 固定批次模式
      if (batchSize.length === 0) return '-';
      const rounds = batchSize.map(b => b.value);
      if (rounds.length <= 5) {
        return `[${rounds.join(',')}]`;
      }
      return `[${rounds.slice(0, 3).join(',')},...,${rounds[rounds.length - 1]}]`;
    }

    return '-';
  }, [config.params.optParams]);

  // 获取算法类型显示文本
  const getAlgTypeText = useMemo(() => {
    const algType = config.params.optParams?.algType;
    if (algType === AlgorithmType.BAYESIAN) return t('sub.params.bayesian');
    if (algType === AlgorithmType.DOE_FILE) return t('sub.params.doe_file');
    return t('sub.params.doe');
  }, [config.params.optParams?.algType, t]);

  // 获取算法类型颜色
  const getAlgTypeColor = useMemo(() => {
    const algType = config.params.optParams?.algType;
    if (algType === AlgorithmType.BAYESIAN) return 'text-accent-foreground';
    if (algType === AlgorithmType.DOE_FILE) return 'text-primary';
    return 'text-primary';
  }, [config.params.optParams?.algType]);

  // 参数数量
  const paramCount = config.params.optParams?.domain?.length || 0;

  const hasParams =
    config.params.mode === 'template'
      ? config.params.templateSetId
      : Object.keys(config.params.customValues).length > 0;
  const hasOutput =
    config.output.mode === 'template'
      ? config.output.outputSetId
      : config.output.selectedOutputIds.length > 0;
  const hasSolver = config.solver.solverId > 0;
  const hasCareDevices = config.careDeviceIds && config.careDeviceIds.length > 0;

  const isParamsActive = drawerMode === 'params' && activeSimTypeId === simType.id;
  const isOutputActive = drawerMode === 'output' && activeSimTypeId === simType.id;
  const isSolverActive = drawerMode === 'solver' && activeSimTypeId === simType.id;
  const isCareDevicesActive = drawerMode === 'careDevices' && activeSimTypeId === simType.id;

  return (
    <div className="flex gap-3 p-3 pt-4">
      {/* 参数配置模块 */}
      <div
        className={`flex-1 bg-card rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          isParamsActive
            ? 'border-primary ring-2 ring-primary/20'
            : hasParams
              ? 'border-primary/60'
              : 'border-border'
        }`}
        onClick={onOpenParams}
      >
        <div className="flex items-center gap-2 mb-2">
          <CogIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t('sub.params_config')}</span>
          {hasParams && <CheckCircleIcon className="w-4 h-4 text-primary ml-auto" />}
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>{t('sub.algorithm')}:</span>
            <span className={`font-medium ${getAlgTypeColor}`}>{getAlgTypeText}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('sub.params.param_count')}:</span>
            <span className="font-medium text-primary">{paramCount}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('sub.params.rounds')}:</span>
            <span
              className="font-medium text-primary truncate max-w-[80px]"
              title={formatBatchRounds}
            >
              {formatBatchRounds}
            </span>
          </div>
        </div>
      </div>

      {/* 输出配置模块 */}
      <div
        className={`flex-1 bg-card rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          isOutputActive
            ? 'border-primary ring-2 ring-primary/20'
            : hasOutput
              ? 'border-primary/60'
              : 'border-border'
        }`}
        onClick={onOpenOutput}
      >
        <div className="flex items-center gap-2 mb-2">
          <CogIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t('sub.output_config')}</span>
          {hasOutput && <CheckCircleIcon className="w-4 h-4 text-primary ml-auto" />}
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>{t('sub.mode')}:</span>
            <span className="font-medium">
              {config.output.mode === 'template' ? t('sub.template') : t('sub.custom')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t('sub.output_count')}:</span>
            <span className="font-medium text-primary">
              {config.output.respDetails?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 求解器模块 */}
      <div
        className={`flex-1 bg-card rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          isSolverActive
            ? 'border-primary ring-2 ring-primary/20'
            : hasSolver
              ? 'border-primary/60'
              : 'border-border'
        }`}
        onClick={onOpenSolver}
      >
        <div className="flex items-center gap-2 mb-2">
          <CogIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t('sub.solver_config')}</span>
          {hasSolver && <CheckCircleIcon className="w-4 h-4 text-primary ml-auto" />}
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>{t('sub.solver')}:</span>
            <span className="font-medium truncate max-w-[80px]">
              {solvers.find(s => s.id === config.solver.solverId)?.name || '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t('sub.mode')}:</span>
            <span
              className={`font-medium ${config.solver.cpuType === 1 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {config.solver.cpuType === 1
                ? `${config.solver.cpuCores}${t('sub.cores')}`
                : t('sub.single_node')}
            </span>
          </div>
          {globalSolver.applyToAll && (
            <div className="text-accent-foreground text-[10px]">{t('sub.use_global_config')}</div>
          )}
        </div>
      </div>

      {/* 关注器件模块 - 始终显示，可为空或手动填写 */}
      <div
        className={`flex-1 bg-card rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          isCareDevicesActive
            ? 'border-primary ring-2 ring-primary/20'
            : hasCareDevices
              ? 'border-primary/60'
              : 'border-border'
        }`}
        onClick={onOpenCareDevices}
      >
        <div className="flex items-center gap-2 mb-2">
          <DevicePhoneMobileIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t('sub.care_devices')}</span>
          {hasCareDevices && <CheckCircleIcon className="w-4 h-4 text-primary ml-auto" />}
        </div>
        <div className="text-xs space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>{t('sub.care_devices_selected')}:</span>
            <span className="font-medium text-primary">{config.careDeviceIds?.length || 0}</span>
          </div>
          {hasCareDevices && (
            <div className="text-[10px] text-muted-foreground truncate">
              {config.careDeviceIds.slice(0, 2).join(', ')}
              {config.careDeviceIds.length > 2 && '...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
