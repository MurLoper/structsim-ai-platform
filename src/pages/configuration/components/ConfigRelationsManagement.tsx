import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { configApi } from '@/api';
import type {
  OutputGroup,
  ParamGroup,
  SimTypeOutputGroupRel,
  SimTypeParamGroupRel,
  SimTypeSolverRel,
} from '@/types/configGroups';
import type { SimType, Solver } from '@/types/config';
import { AddRelationModal } from './relations/AddRelationModal';
import { RelationAssignmentsCard } from './relations/RelationAssignmentsCard';
import { RelationSimTypeList } from './relations/RelationSimTypeList';
import { RelationTabBar } from './relations/RelationTabBar';
import type { RelationCardItem, RelationTab, RelationTabConfig } from './relations/types';

const RELATION_TABS: RelationTabConfig[] = [
  {
    tab: 'paramGroups',
    label: '参数组合',
    title: '参数组合关联',
    emptyText: '暂无参数组合关联',
    addTitle: '添加参数组合关联',
  },
  {
    tab: 'outputGroups',
    label: '输出组合',
    title: '输出组合关联',
    emptyText: '暂无输出组合关联',
    addTitle: '添加输出组合关联',
  },
  {
    tab: 'solvers',
    label: '求解器',
    title: '求解器关联',
    emptyText: '暂无求解器关联',
    addTitle: '添加求解器关联',
  },
];

const mapParamGroupRelations = (relations: SimTypeParamGroupRel[]): RelationCardItem[] =>
  relations.map(relation => ({
    id: relation.id,
    itemId: relation.paramGroupId,
    name: relation.paramGroupName || `参数组合 #${relation.paramGroupId}`,
    description: relation.paramGroupDescription,
    isDefault: relation.isDefault === 1,
  }));

const mapOutputGroupRelations = (relations: SimTypeOutputGroupRel[]): RelationCardItem[] =>
  relations.map(relation => ({
    id: relation.id,
    itemId: relation.outputGroupId,
    name: relation.outputGroupName || `输出组合 #${relation.outputGroupId}`,
    description: relation.outputGroupDescription,
    isDefault: relation.isDefault === 1,
  }));

const mapSolverRelations = (relations: SimTypeSolverRel[]): RelationCardItem[] =>
  relations.map(relation => ({
    id: relation.id,
    itemId: relation.solverId,
    name: relation.solverName || `求解器 #${relation.solverId}`,
    description: relation.solverCode ? `${relation.solverCode} | v${relation.solverVersion}` : '',
    isDefault: relation.isDefault === 1,
  }));

export const ConfigRelationsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RelationTab>('paramGroups');
  const [simTypes, setSimTypes] = useState<SimType[]>([]);
  const [selectedSimType, setSelectedSimType] = useState<SimType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<RelationTab | null>(null);

  const [paramGroupRelations, setParamGroupRelations] = useState<SimTypeParamGroupRel[]>([]);
  const [outputGroupRelations, setOutputGroupRelations] = useState<SimTypeOutputGroupRel[]>([]);
  const [solverRelations, setSolverRelations] = useState<SimTypeSolverRel[]>([]);

  const [allParamGroups, setAllParamGroups] = useState<ParamGroup[]>([]);
  const [allOutputGroups, setAllOutputGroups] = useState<OutputGroup[]>([]);
  const [allSolvers, setAllSolvers] = useState<Solver[]>([]);

  const loadSimTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await configApi.getSimTypes();
      setSimTypes(response.data || []);
    } catch (error) {
      console.error('加载仿真类型失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllConfigs = useCallback(async () => {
    try {
      const [paramGroupsRes, outputGroupsRes, solversRes] = await Promise.all([
        configApi.getParamGroups(),
        configApi.getOutputGroups(),
        configApi.getSolvers(),
      ]);
      setAllParamGroups((paramGroupsRes.data || []) as ParamGroup[]);
      setAllOutputGroups((outputGroupsRes.data || []) as OutputGroup[]);
      setAllSolvers((solversRes.data || []) as Solver[]);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }, []);

  const loadSimTypeRelations = useCallback(async (simTypeId: number, tab: RelationTab) => {
    try {
      if (tab === 'paramGroups') {
        const response = await configApi.getSimTypeParamGroups(simTypeId);
        setParamGroupRelations((response.data || []) as SimTypeParamGroupRel[]);
        return;
      }
      if (tab === 'outputGroups') {
        const response = await configApi.getSimTypeOutputGroups(simTypeId);
        setOutputGroupRelations((response.data || []) as SimTypeOutputGroupRel[]);
        return;
      }
      const response = await configApi.getSimTypeSolvers(simTypeId);
      setSolverRelations((response.data || []) as SimTypeSolverRel[]);
    } catch (error) {
      console.error('加载关联配置失败:', error);
    }
  }, []);

  useEffect(() => {
    void loadSimTypes();
    void loadAllConfigs();
  }, [loadAllConfigs, loadSimTypes]);

  useEffect(() => {
    if (!selectedSimType) {
      return;
    }
    void loadSimTypeRelations(selectedSimType.id, activeTab);
  }, [activeTab, loadSimTypeRelations, selectedSimType]);

  const relationCards = useMemo(
    () => ({
      paramGroups: mapParamGroupRelations(paramGroupRelations),
      outputGroups: mapOutputGroupRelations(outputGroupRelations),
      solvers: mapSolverRelations(solverRelations),
    }),
    [outputGroupRelations, paramGroupRelations, solverRelations]
  );

  const modalItems = useMemo(
    () => ({
      paramGroups: allParamGroups,
      outputGroups: allOutputGroups,
      solvers: allSolvers,
    }),
    [allOutputGroups, allParamGroups, allSolvers]
  );

  const activeTabConfig = RELATION_TABS.find(item => item.tab === activeTab) || RELATION_TABS[0];
  const activeRelations = relationCards[activeTab];

  const refreshCurrentTab = useCallback(async () => {
    if (!selectedSimType) {
      return;
    }
    await loadSimTypeRelations(selectedSimType.id, activeTab);
  }, [activeTab, loadSimTypeRelations, selectedSimType]);

  const handleAddRelation = useCallback(
    async (itemId: number, isDefault: number) => {
      if (!selectedSimType) return;

      try {
        if (activeTab === 'paramGroups') {
          await configApi.addParamGroupToSimType(selectedSimType.id, {
            paramGroupId: itemId,
            isDefault,
          });
        } else if (activeTab === 'outputGroups') {
          await configApi.addOutputGroupToSimType(selectedSimType.id, {
            outputGroupId: itemId,
            isDefault,
          });
        } else {
          await configApi.addSolverToSimType(selectedSimType.id, { solverId: itemId, isDefault });
        }
        setActiveModalTab(null);
        await refreshCurrentTab();
      } catch (error) {
        console.error('添加关联配置失败:', error);
      }
    },
    [activeTab, refreshCurrentTab, selectedSimType]
  );

  const handleSetDefault = useCallback(
    async (itemId: number) => {
      if (!selectedSimType) return;

      try {
        if (activeTab === 'paramGroups') {
          await configApi.setDefaultParamGroup(selectedSimType.id, itemId);
        } else if (activeTab === 'outputGroups') {
          await configApi.setDefaultOutputGroup(selectedSimType.id, itemId);
        } else {
          await configApi.setDefaultSolver(selectedSimType.id, itemId);
        }
        await refreshCurrentTab();
      } catch (error) {
        console.error('设置默认关联失败:', error);
      }
    },
    [activeTab, refreshCurrentTab, selectedSimType]
  );

  const handleRemoveRelation = useCallback(
    async (itemId: number) => {
      if (!selectedSimType) return;
      if (!window.confirm('确定要移除这个关联配置吗？')) {
        return;
      }

      try {
        if (activeTab === 'paramGroups') {
          await configApi.removeParamGroupFromSimType(selectedSimType.id, itemId);
        } else if (activeTab === 'outputGroups') {
          await configApi.removeOutputGroupFromSimType(selectedSimType.id, itemId);
        } else {
          await configApi.removeSolverFromSimType(selectedSimType.id, itemId);
        }
        await refreshCurrentTab();
      } catch (error) {
        console.error('移除关联配置失败:', error);
      }
    },
    [activeTab, refreshCurrentTab, selectedSimType]
  );

  const existingIds = useMemo(
    () => new Set(activeRelations.map(relation => relation.itemId)),
    [activeRelations]
  );

  const getModalItemLabel = useCallback((item: ParamGroup | OutputGroup | Solver) => item.name, []);

  const getModalItemSubLabel = useCallback((item: ParamGroup | OutputGroup | Solver) => {
    if ('version' in item) {
      return `${item.code} | v${item.version}`;
    }
    return 'description' in item ? item.description : undefined;
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <RelationSimTypeList
          loading={loading}
          simTypes={simTypes}
          selectedSimType={selectedSimType}
          onSelect={setSelectedSimType}
        />
      </div>

      <div className="lg:col-span-3">
        {!selectedSimType ? (
          <Card>
            <div className="p-12 text-center text-slate-500">请选择左侧仿真类型以查看关联配置</div>
          </Card>
        ) : (
          <>
            <RelationTabBar activeTab={activeTab} tabs={RELATION_TABS} onChange={setActiveTab} />
            <RelationAssignmentsCard
              title={`${selectedSimType.name} - ${activeTabConfig.title}`}
              emptyText={activeTabConfig.emptyText}
              relations={activeRelations}
              onAdd={() => setActiveModalTab(activeTab)}
              onSetDefault={handleSetDefault}
              onRemove={handleRemoveRelation}
            />
          </>
        )}
      </div>

      {activeModalTab && selectedSimType && (
        <AddRelationModal
          title={RELATION_TABS.find(item => item.tab === activeModalTab)?.addTitle || '添加关联'}
          items={modalItems[activeModalTab]}
          existingIds={existingIds}
          onAdd={handleAddRelation}
          onClose={() => setActiveModalTab(null)}
          getItemLabel={getModalItemLabel}
          getItemSubLabel={getModalItemSubLabel}
        />
      )}
    </div>
  );
};
