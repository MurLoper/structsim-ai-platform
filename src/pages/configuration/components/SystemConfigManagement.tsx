import React, { useState, useEffect } from 'react';
import { Badge, Card } from '@/components/ui';
import { configApi } from '@/api';

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
  const [activeTab, setActiveTab] = useState<'status' | 'automation'>('status');
  const [statusDefs, setStatusDefs] = useState<StatusDef[]>([]);
  const [automationModules, setAutomationModules] = useState<AutomationModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);

  // 加载状态定义
  const loadStatusDefs = async () => {
    try {
      setLoading(true);
      setStatusError(null);
      const response = await configApi.getStatusDefs();
      setStatusDefs(response.data || []);
    } catch (error) {
      console.error('加载状态定义失败:', error);
      setStatusError('加载状态定义失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  // 加载自动化模块
  const loadAutomationModules = async () => {
    try {
      setLoading(true);
      setAutomationError(null);
      const response = await configApi.getAutomationModules();
      setAutomationModules(response.data || []);
    } catch (error) {
      console.error('加载自动化模块失败:', error);
      setAutomationError('加载自动化模块失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'status') {
      loadStatusDefs();
    } else {
      loadAutomationModules();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* 标签页切换 */}
      <div className="flex gap-2 border-b dark:border-slate-700">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'status'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          状态定义
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'automation'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          自动化模块
        </button>
      </div>

      {/* 状态定义 */}
      {activeTab === 'status' && (
        <Card>
          <div className="p-4 border-b dark:border-slate-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">状态定义管理</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant="info" size="sm">只读</Badge>
              <span>由系统同步，暂不支持编辑</span>
            </div>
          </div>
          <div className="p-4">
            {statusError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {statusError}
              </div>
            )}
            {loading ? (
              <div className="text-center py-8 text-slate-500">加载中...</div>
            ) : statusDefs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">暂无状态定义</div>
            ) : (
              <div className="space-y-2">
                {statusDefs.map(status => (
                  <div
                    key={status.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full ${getStatusColorClass(status.colorTag)}`}
                      />
                      <div>
                        <div className="font-medium">{status.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {status.code} | {status.statusType}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" size="sm">只读</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 自动化模块 */}
      {activeTab === 'automation' && (
        <Card>
          <div className="p-4 border-b dark:border-slate-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">自动化模块管理</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant="info" size="sm">只读</Badge>
              <span>由系统同步，暂不支持编辑</span>
            </div>
          </div>
          <div className="p-4">
            {automationError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {automationError}
              </div>
            )}
            {loading ? (
              <div className="text-center py-8 text-slate-500">加载中...</div>
            ) : automationModules.length === 0 ? (
              <div className="text-center py-12 text-slate-500">暂无自动化模块</div>
            ) : (
              <div className="space-y-2">
                {automationModules.map(module => (
                  <div
                    key={module.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {module.code} | {module.moduleType} | v{module.version || '1.0'}
                      </div>
                      {module.remark && (
                        <div className="text-xs text-slate-400 mt-1">{module.remark}</div>
                      )}
                    </div>
                    <Badge variant="default" size="sm">只读</Badge>
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
