/**
 * 流程结果展示组件
 *
 * 展示仿真类型下各轮次的流程执行状态
 */
import { useState, useMemo } from 'react';
import { Card, Badge, Select } from '@/components/ui';
import { RoundFlow, type WorkflowNode } from './RoundFlow';
import type { RoundItem, SimTypeResult } from '@/api/results';

export interface ProcessViewProps {
  /** 仿真类型结果列表 */
  simTypeResults: SimTypeResult[];
  /** 按仿真类型分组的轮次数据 */
  roundsBySimType: Array<{ simTypeId: number; rounds: RoundItem[] }>;
  /** 仿真类型名称映射 */
  simTypeLabelMap: Map<number, string>;
  /** 工作流节点配置 */
  workflowNodes: WorkflowNode[];
  /** 是否加载中 */
  loading?: boolean;
}

/** 状态筛选选项 */
const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '1', label: '运行中' },
  { value: '2', label: '已完成' },
  { value: '3', label: '失败' },
];

/** 状态配置 */
const STATUS_CONFIG: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  0: { label: '待运行', variant: 'default' },
  1: { label: '运行中', variant: 'warning' },
  2: { label: '已完成', variant: 'success' },
  3: { label: '失败', variant: 'error' },
};

/** 单个轮次流程卡片 */
interface RoundFlowCardProps {
  round: RoundItem & { simTypeId: number; simTypeName: string };
  simTypeName: string;
  workflowNodes: WorkflowNode[];
}

const RoundFlowCard: React.FC<RoundFlowCardProps> = ({ round, simTypeName, workflowNodes }) => {
  const statusConfig = STATUS_CONFIG[round.status] || STATUS_CONFIG[0];

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">轮次 #{round.roundIndex}</span>
            <Badge variant="default" size="sm">
              {simTypeName}
            </Badge>
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
          </div>
          {round.errorMsg && (
            <span className="text-sm text-red-500 truncate max-w-[300px]" title={round.errorMsg}>
              {round.errorMsg}
            </span>
          )}
        </div>
        <RoundFlow
          nodes={workflowNodes}
          currentNodeId={round.flowCurNodeId}
          nodeProgress={round.flowNodeProgress}
          status={round.status}
          stuckModuleId={round.stuckModuleId}
        />
      </div>
    </Card>
  );
};

export const ProcessView: React.FC<ProcessViewProps> = ({
  simTypeResults,
  roundsBySimType,
  simTypeLabelMap,
  workflowNodes,
  loading = false,
}) => {
  const [selectedSimType, setSelectedSimType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 仿真类型选项
  const simTypeOptions = useMemo(() => {
    const options = [{ value: 'all', label: '全部仿真类型' }];
    simTypeResults.forEach(r => {
      options.push({
        value: String(r.simTypeId),
        label: simTypeLabelMap.get(r.simTypeId) || `SimType-${r.simTypeId}`,
      });
    });
    return options;
  }, [simTypeResults, simTypeLabelMap]);

  // 筛选后的轮次数据
  const filteredRounds = useMemo(() => {
    let rounds: Array<RoundItem & { simTypeId: number; simTypeName: string }> = [];

    roundsBySimType.forEach(group => {
      if (selectedSimType !== 'all' && String(group.simTypeId) !== selectedSimType) {
        return;
      }
      const simTypeName = simTypeLabelMap.get(group.simTypeId) || `SimType-${group.simTypeId}`;
      group.rounds.forEach(round => {
        rounds.push({ ...round, simTypeId: group.simTypeId, simTypeName });
      });
    });

    // 状态筛选
    if (statusFilter !== 'all') {
      const statusNum = Number(statusFilter);
      rounds = rounds.filter(r => r.status === statusNum);
    }

    return rounds;
  }, [roundsBySimType, selectedSimType, statusFilter, simTypeLabelMap]);

  // 分页
  const paginatedRounds = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRounds.slice(start, start + pageSize);
  }, [filteredRounds, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRounds.length / pageSize);

  if (loading) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center text-slate-500">加载中...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <Select
              label="仿真类型"
              value={selectedSimType}
              onChange={e => {
                setSelectedSimType(e.target.value);
                setCurrentPage(1);
              }}
              options={simTypeOptions}
            />
          </div>
          <div className="min-w-[140px]">
            <Select
              label="状态"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="text-sm text-slate-500">共 {filteredRounds.length} 条记录</div>
        </div>
      </Card>

      {/* 轮次流程列表 */}
      {paginatedRounds.length === 0 ? (
        <Card>
          <div className="h-32 flex items-center justify-center text-slate-500">
            暂无匹配的轮次数据
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedRounds.map(round => (
            <RoundFlowCard
              key={`${round.simTypeId}-${round.id}`}
              round={round}
              simTypeName={round.simTypeName}
              workflowNodes={workflowNodes}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-slate-600">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessView;
