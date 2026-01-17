import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RESOURCES } from '@/locales';
import { Card, Tabs, Badge } from '@/components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const Results: React.FC = () => {
  const { id } = useParams();
  const { language } = useUIStore();
  const t = (key: string) => RESOURCES[language][key] || key;
  const [activeTab, setActiveTab] = React.useState('overview');

  const tabs = [
    { key: 'overview', label: t('res.tab.overview') },
    { key: 'analysis', label: t('res.tab.analysis') },
    { key: 'process', label: t('res.tab.process') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('res.title')}: {id}
          </h1>
          <p className="text-slate-500 text-sm">{t('res.report')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-600">50</div>
              <div className="text-sm text-slate-500">{t('res.iterations')}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">#12</div>
              <div className="text-sm text-slate-500">{t('res.best')}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Badge variant="success" size="md">
                Success
              </Badge>
              <div className="text-sm text-slate-500 mt-2">{t('res.status')}</div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'analysis' && (
        <Card>
          <div className="h-64 flex items-center justify-center text-slate-500">
            Chart visualization will be displayed here
          </div>
        </Card>
      )}

      {activeTab === 'process' && (
        <Card>
          <div className="h-64 flex items-center justify-center text-slate-500">
            Process workflow visualization will be displayed here
          </div>
        </Card>
      )}
    </div>
  );
};

export default Results;
