import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, Card, Badge } from '@/components/ui';
import { ArrowRightIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { SimulationType, SubmissionRequest, SimConfiguration, ParamStrategy } from '@/types';
import { useStatusDefs } from '@/features/config/queries/useCompositeConfigs';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

// Helper to create mock data
const createMockProcess = (workflowId: string, statusId: string) => ({
  workflowId,
  currentStepIndex: 3,
  statusId,
  steps: [],
});

const createMockSimConfig = (type: SimulationType): SimConfiguration => ({
  id: `sim_${type}`,
  type,
  isActive: true,
  parameters: [],
  selectedLoadCases: [],
  optConfig: { strategy: ParamStrategy.DOE, rounds: 5, samples: 20 },
  outputMetrics: [],
  solverConfig: { version: '2023.R1', processors: 16, memory: 64, precision: 'DOUBLE' },
});

// Mock data - will be replaced with API calls
const MOCK_REQUESTS: SubmissionRequest[] = [
  {
    id: 'REQ-2023-001',
    projectId: 'p1',
    projectNameSnapshot: 'Chassis Stiffness',
    workflowId: 'wf_req_std',
    process: createMockProcess('wf_req_std', 's_success'),
    configurations: [createMockSimConfig(SimulationType.STATIC)],
    createdAt: '2023-10-15',
    sourceType: 'path',
    sourceValue: '/data/chassis_v1.stp',
    attitudeId: 0,
    participantIds: ['u1', 'u2'],
    remarks: 'Initial run',
  },
  {
    id: 'REQ-2023-002',
    projectId: 'p2',
    projectNameSnapshot: 'Battery Pack',
    workflowId: 'wf_req_std',
    process: createMockProcess('wf_req_std', 's_running'),
    configurations: [createMockSimConfig(SimulationType.THERMAL)],
    createdAt: '2023-10-16',
    sourceType: 'id',
    sourceValue: 'CAD-99283',
    attitudeId: 90,
    participantIds: ['u2'],
    remarks: 'Thermal check',
  },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useUIStore();
  const { data: statusDefs } = useStatusDefs();
  const t = (key: string) => RESOURCES[language][key] || key;

  const getStatusBadge = (statusId: string) => {
    const config = statusDefs?.find(
      status => status.code === statusId || String(status.id) === String(statusId)
    );
    if (!config) return <Badge>Unknown</Badge>;

    const variant = statusId.includes('success')
      ? 'success'
      : statusId.includes('failed')
        ? 'error'
        : statusId.includes('running')
          ? 'info'
          : 'default';

    return <Badge variant={variant}>{config.name}</Badge>;
  };

  const calculateProgress = (req: SubmissionRequest) => {
    const totalSteps = 3;
    const current = req.process.currentStepIndex;
    return Math.min(Math.round((current / totalSteps) * 100), 100);
  };

  const columns = useMemo<ColumnDef<SubmissionRequest>[]>(
    () => [
      {
        header: t('dash.col.id'),
        accessorKey: 'id',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-500">{row.original.id}</span>
        ),
      },
      {
        header: t('dash.col.name'),
        accessorKey: 'projectNameSnapshot',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {row.original.projectNameSnapshot}
            </div>
            <div className="text-xs text-slate-500">{row.original.projectId}</div>
          </div>
        ),
      },
      {
        header: t('dash.col.types'),
        accessorKey: 'configurations',
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {row.original.configurations.map(c => (
              <Badge key={c.type} size="sm">
                {c.type.split(' ')[0]}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        header: t('dash.col.status'),
        accessorKey: 'process',
        cell: ({ row }) => getStatusBadge(row.original.process.statusId),
      },
      {
        header: t('dash.col.progress'),
        accessorKey: 'createdAt',
        cell: ({ row }) => {
          const progress = calculateProgress(row.original);
          return (
            <div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 max-w-[100px]">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 mt-1 block">{progress}%</span>
            </div>
          );
        },
      },
      {
        header: t('dash.col.action'),
        accessorKey: 'id',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/results/${row.original.id}`)}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1"
            >
              {t('dash.view_results')} <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, t]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('dash.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t('dash.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/create')} icon={<BeakerIcon className="w-5 h-5" />}>
          {t('dash.new_sim')}
        </Button>
      </div>

      <Card padding="none">
        <DataTable
          data={MOCK_REQUESTS}
          columns={columns}
          containerHeight={480}
          enableSorting={false}
          showCount={false}
          className="border-none"
          wrapperClassName="p-4"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
