import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore, useConfigStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Button, Card, Badge } from '@/components/ui';
import { ArrowRightIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { SimulationType, SubmissionRequest, SimConfiguration, ParamStrategy } from '@/types';

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
  const { getStatus } = useConfigStore();
  const t = (key: string) => RESOURCES[language][key] || key;

  const getStatusBadge = (statusId: string) => {
    const config = getStatus(Number(statusId));
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">{t('dash.col.id')}</th>
              <th className="px-6 py-4">{t('dash.col.name')}</th>
              <th className="px-6 py-4">{t('dash.col.types')}</th>
              <th className="px-6 py-4">{t('dash.col.status')}</th>
              <th className="px-6 py-4">{t('dash.col.progress')}</th>
              <th className="px-6 py-4 text-right">{t('dash.col.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {MOCK_REQUESTS.map(task => {
              const progress = calculateProgress(task);
              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{task.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {task.projectNameSnapshot}
                    </div>
                    <div className="text-xs text-slate-500">{task.projectId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {task.configurations.map(c => (
                        <Badge key={c.type} size="sm">
                          {c.type.split(' ')[0]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(task.process.statusId)}</td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 max-w-[100px]">
                      <div
                        className="h-1.5 rounded-full bg-brand-500 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{progress}%</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/results/${task.id}`)}
                      className="text-brand-600 hover:text-brand-700 font-medium text-sm flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {t('dash.view_results')} <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Dashboard;
