import React, { useState } from 'react';
import { Tabs } from '@/components/ui';
import { FileText, Boxes, PlusSquare } from 'lucide-react';
import OrderList from './OrderList';
import Results from '../dashboard/Results';
import Submission from '../submission';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';

interface TabItem {
  key: string;
  type: 'list' | 'result' | 'create';
  orderId?: number;
  label: string;
  icon: React.ReactNode;
}

const OrdersWorkspace: React.FC = () => {
  const { language } = useUIStore();

  const [tabs, setTabs] = useState<TabItem[]>([
    {
      key: 'list',
      type: 'list',
      label: RESOURCES[language]?.['orders.title'] || '申请单列表',
      icon: <FileText className="w-4 h-4" />,
    },
    // If opened with an orderId in URL, we might want to auto-open the create/edit tab.
    // For now, let's keep it simple.
  ]);

  const [activeKey, setActiveKey] = useState('list');

  const addTab = (tab: TabItem) => {
    setTabs(prev => {
      if (prev.find(t => t.key === tab.key)) return prev;
      return [...prev, tab];
    });
    setActiveKey(tab.key);
  };

  const removeTab = (targetKey: string) => {
    let newActiveKey = activeKey;
    const lastIndex = tabs.findIndex(pane => pane.key === targetKey);
    const newTabs = tabs.filter(pane => pane.key !== targetKey);

    if (newTabs.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newTabs[Math.max(lastIndex - 1, 0)].key;
      } else {
        newActiveKey = newTabs[0].key;
      }
    }
    setTabs(newTabs);
    setActiveKey(newActiveKey);
  };

  const handleOpenResult = (orderId: number) => {
    addTab({
      key: `result-${orderId}`,
      type: 'result',
      orderId,
      label: `结果 #${orderId}`,
      icon: <Boxes className="w-4 h-4" />,
    });
  };

  const handleOpenEdit = (orderId: number) => {
    addTab({
      key: `create-${orderId}`,
      type: 'create',
      orderId,
      label: `编辑 #${orderId}`,
      icon: <PlusSquare className="w-4 h-4" />,
    });
  };

  const handleCreate = () => {
    const key = `create-new-${Date.now()}`;
    addTab({
      key,
      type: 'create',
      label: '新建申请单',
      icon: <PlusSquare className="w-4 h-4" />,
    });
  };

  const tabItems = tabs.map(tab => ({
    key: tab.key,
    label: (
      <div className="flex items-center gap-2 group">
        {tab.icon}
        <span>{tab.label}</span>
        {tab.key !== 'list' && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => {
              e.stopPropagation();
              removeTab(tab.key);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                removeTab(tab.key);
              }
            }}
            className="opacity-0 group-hover:opacity-100 ml-1 rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L13 13M1 13L13 1L1 13Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
    ),
  }));

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50 dark:bg-slate-950 eyecare:bg-background">
      <div className="px-6 pt-4 sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-950/80 eyecare:bg-background/80 backdrop-blur">
        <Tabs items={tabItems} activeKey={activeKey} onChange={setActiveKey} variant="default" />
      </div>

      <div className="flex-1 relative">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${tab.key === activeKey ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'}`}
          >
            {tab.type === 'list' && (
              <div className="flex-1 overflow-auto px-6 py-4">
                <OrderList
                  onOpenResult={handleOpenResult}
                  onOpenEdit={handleOpenEdit}
                  onCreate={handleCreate}
                />
              </div>
            )}
            {tab.type === 'result' && tab.orderId && (
              <div className="flex-1 overflow-auto px-6 py-4">
                <Results
                  orderId={tab.orderId}
                  onOpenEdit={handleOpenEdit}
                  onClose={() => removeTab(tab.key)}
                />
              </div>
            )}
            {tab.type === 'create' && (
              <div className="flex-1 h-full relative">
                <Submission orderId={tab.orderId} onClose={() => removeTab(tab.key)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersWorkspace;
