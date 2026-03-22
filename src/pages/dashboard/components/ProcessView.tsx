/**
 * 流程结果展示组件
 *
 * 展示工况方案下各轮次的流程执行状态。
 */
import { useState, useMemo } from 'react';
import { Card, Badge, Select } from '@/components/ui';
import { RoundFlow, type WorkflowNode } from './RoundFlow';
import type { RoundItem, SimTypeResult } from '@/api/results';

export interface ProcessViewProps {
  schemeResults: SimTypeResult[];
  schemeRoundGroups: Array<{ schemeId: number; rounds: RoundItem[] }>;
  schemeLabelMap: Map<number, string>;
  workflowNodes: WorkflowNode[];
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '1', label: '运行中' },
  { value: '2', label: '已完成' },
  { value: '3', label: '失败' },
];

const STATUS_CONFIG: Record<
  number,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  0: { label: '待运行', variant: 'default' },
  1: { label: '运行中', variant: 'warning' },
  2: { label: '已完成', variant: 'success' },
  3: { label: '失败', variant: 'error' },
};

interface RoundFlowCardProps {
  round: RoundItem & { schemeId: number; schemeName: string };
  schemeName: string;
  workflowNodes: WorkflowNode[];
}

const RoundFlowCard: React.FC<RoundFlowCardProps> = ({ round, schemeName, workflowNodes }) => {
  const statusConfig = STATUS_CONFIG[round.status] || STATUS_CONFIG[0];

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">轮次 #{round.roundIndex}</span>
            <Badge variant="default" size="sm">
              {schemeName}
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
  schemeResults,
  schemeRoundGroups,
  schemeLabelMap,
  workflowNodes,
  loading = false,
}) => {
  const [selectedScheme, setSelectedScheme] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const schemeOptions = useMemo(() => {
    const options = [{ value: 'all', label: '全部工况方案' }];
    schemeResults.forEach(result => {
      const schemeId = result.simTypeId;
      options.push({
        value: String(schemeId),
        label: schemeLabelMap.get(schemeId) || `方案-${schemeId}`,
      });
    });
    return options;
  }, [schemeResults, schemeLabelMap]);

  const filteredRounds = useMemo(() => {
    let rounds: Array<RoundItem & { schemeId: number; schemeName: string }> = [];

    schemeRoundGroups.forEach(group => {
      if (selectedScheme !== 'all' && String(group.schemeId) !== selectedScheme) {
        return;
      }
      const schemeName = schemeLabelMap.get(group.schemeId) || `方案-${group.schemeId}`;
      group.rounds.forEach(round => {
        rounds.push({ ...round, schemeId: group.schemeId, schemeName });
      });
    });

    if (statusFilter !== 'all') {
      const statusNum = Number(statusFilter);
      rounds = rounds.filter(round => round.status === statusNum);
    }

    return rounds;
  }, [schemeRoundGroups, selectedScheme, statusFilter, schemeLabelMap]);

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
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <Select
              label="工况方案"
              value={selectedScheme}
              onChange={event => {
                setSelectedScheme(event.target.value);
                setCurrentPage(1);
              }}
              options={schemeOptions}
            />
          </div>
          <div className="min-w-[140px]">
            <Select
              label="状态"
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="text-sm text-slate-500">共 {filteredRounds.length} 条记录</div>
        </div>
      </Card>

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
              key={`${round.schemeId}-${round.id}`}
              round={round}
              schemeName={round.schemeName}
              workflowNodes={workflowNodes}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-slate-600">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
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
