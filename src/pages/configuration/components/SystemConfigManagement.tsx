import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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

export const SystemConfigManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'automation'>('status');
  const [statusDefs, setStatusDefs] = useState<StatusDef[]>([]);
  const [automationModules, setAutomationModules] = useState<AutomationModule[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载状态定义
  const loadStatusDefs = async () => {
    try {
      setLoading(true);
      const response = await configApi.getStatusDefs();
      setStatusDefs(response.data || []);
    } catch (error) {
      console.error('加载状态定义失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载自动化模块
  const loadAutomationModules = async () => {
    try {
      setLoading(true);
      const response = await configApi.getAutomationModules();
      setAutomationModules(response.data || []);
    } catch (error) {
      console.error('加载自动化模块失败:', error);
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
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">状态定义管理</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              新建状态
            </button>
          </div>
          <div className="p-4">
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
                        className={`w-3 h-3 rounded-full bg-${status.colorTag || 'gray'}-500`}
                      />
                      <div>
                        <div className="font-medium">{status.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {status.code} | {status.statusType}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                        <PencilIcon className="w-4 h-4 text-slate-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
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
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">自动化模块管理</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              新建模块
            </button>
          </div>
          <div className="p-4">
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
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                        <PencilIcon className="w-4 h-4 text-slate-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
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
