import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Card } from '@/components/ui';
import { configApi } from '@/api';
import { useI18n } from '@/hooks/useI18n';

interface StatusDef {
  id: number;
  name: string;
  code: string;
  statusType: string;
  colorTag?: string;
  sort: number;
  remark?: string;
}

interface AutomationModule {
  id: number;
  name: string;
  code: string;
  moduleType: string;
  version?: string;
  sort: number;
  remark?: string;
}

const STATUS_COLOR_CLASSES: Record<string, string> = {
  gray: 'bg-gray-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};

const getStatusColorClass = (colorTag?: string) =>
  STATUS_COLOR_CLASSES[colorTag ?? 'gray'] || STATUS_COLOR_CLASSES.gray;

export const SystemConfigManagement: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'status' | 'automation'>('status');
  const [statusDefs, setStatusDefs] = useState<StatusDef[]>([]);
  const [automationModules, setAutomationModules] = useState<AutomationModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);

  const loadStatusDefs = useCallback(async () => {
    try {
      setLoading(true);
      setStatusError(null);
      const response = await configApi.getStatusDefs();
      setStatusDefs(response.data || []);
    } catch (error) {
      console.error('Failed to load status definitions:', error);
      setStatusError(t('cfg.system.status_load_failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadAutomationModules = useCallback(async () => {
    try {
      setLoading(true);
      setAutomationError(null);
      const response = await configApi.getAutomationModules();
      setAutomationModules(response.data || []);
    } catch (error) {
      console.error('Failed to load automation modules:', error);
      setAutomationError(t('cfg.system.automation_load_failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === 'status') {
      loadStatusDefs();
    } else {
      loadAutomationModules();
    }
  }, [activeTab, loadAutomationModules, loadStatusDefs]);

  const renderReadonlyHeader = (title: string) => (
    <div className="flex flex-col gap-2 border-b p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Badge variant="info" size="sm">
          {t('cfg.system.readonly')}
        </Badge>
        <span>{t('cfg.system.synced_readonly')}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b dark:border-slate-700">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'status'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 eyecare:text-muted-foreground'
          }`}
        >
          {t('cfg.system.status_defs')}
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'automation'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 eyecare:text-muted-foreground'
          }`}
        >
          {t('cfg.system.automation_modules')}
        </button>
      </div>

      {activeTab === 'status' && (
        <Card>
          {renderReadonlyHeader(t('cfg.system.status_defs_title'))}
          <div className="p-4">
            {statusError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {statusError}
              </div>
            )}
            {loading ? (
              <div className="py-8 text-center text-slate-500">{t('common.loading')}</div>
            ) : statusDefs.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                {t('cfg.system.empty_status_defs')}
              </div>
            ) : (
              <div className="space-y-2">
                {statusDefs.map(status => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 rounded-full ${getStatusColorClass(status.colorTag)}`}
                      />
                      <div>
                        <div className="font-medium">{status.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {status.code} | {status.statusType}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" size="sm">
                      {t('cfg.system.readonly')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'automation' && (
        <Card>
          {renderReadonlyHeader(t('cfg.system.automation_modules_title'))}
          <div className="p-4">
            {automationError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {automationError}
              </div>
            )}
            {loading ? (
              <div className="py-8 text-center text-slate-500">{t('common.loading')}</div>
            ) : automationModules.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                {t('cfg.system.empty_automation_modules')}
              </div>
            ) : (
              <div className="space-y-2">
                {automationModules.map(module => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50"
                  >
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {module.code} | {module.moduleType} | v{module.version || '1.0'}
                      </div>
                      {module.remark && (
                        <div className="mt-1 text-xs text-slate-400">{module.remark}</div>
                      )}
                    </div>
                    <Badge variant="default" size="sm">
                      {t('cfg.system.readonly')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
