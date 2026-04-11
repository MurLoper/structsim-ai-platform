import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, useConfirmDialog } from '@/components/ui';
import { configApi } from '@/api';
import type {
  OutputGroup,
  ParamGroup,
  SimTypeOutputGroupRel,
  SimTypeParamGroupRel,
  SimTypeSolverRel,
} from '@/types/configGroups';
import type { SimType, Solver } from '@/types/config';
import { useI18n } from '@/hooks';
import { AddRelationModal } from './relations/AddRelationModal';
import { RelationAssignmentsCard } from './relations/RelationAssignmentsCard';
import { RelationSimTypeList } from './relations/RelationSimTypeList';
import { RelationTabBar } from './relations/RelationTabBar';
import type { RelationCardItem, RelationTab, RelationTabConfig } from './relations/types';

const RELATION_TAB_KEYS = [
  {
    tab: 'paramGroups',
    labelKey: 'cfg.relations.param_groups',
    titleKey: 'cfg.relations.param_groups_title',
    emptyTextKey: 'cfg.relations.param_groups_empty',
    addTitleKey: 'cfg.relations.param_groups_add',
  },
  {
    tab: 'outputGroups',
    labelKey: 'cfg.relations.output_groups',
    titleKey: 'cfg.relations.output_groups_title',
    emptyTextKey: 'cfg.relations.output_groups_empty',
    addTitleKey: 'cfg.relations.output_groups_add',
  },
  {
    tab: 'solvers',
    labelKey: 'cfg.relations.solvers',
    titleKey: 'cfg.relations.solvers_title',
    emptyTextKey: 'cfg.relations.solvers_empty',
    addTitleKey: 'cfg.relations.solvers_add',
  },
] satisfies Array<{
  tab: RelationTab;
  labelKey: string;
  titleKey: string;
  emptyTextKey: string;
  addTitleKey: string;
}>;

type Translator = (key: string, params?: Record<string, string | number>) => string;

const mapParamGroupRelations = (
  relations: SimTypeParamGroupRel[],
  t: Translator
): RelationCardItem[] =>
  relations.map(relation => ({
    id: relation.id,
    itemId: relation.paramGroupId,
    name:
      relation.paramGroupName ||
      t('cfg.relations.param_group_fallback', { id: relation.paramGroupId }),
    description: relation.paramGroupDescription,
    isDefault: relation.isDefault === 1,
  }));

const mapOutputGroupRelations = (
  relations: SimTypeOutputGroupRel[],
  t: Translator
): RelationCardItem[] =>
  relations.map(relation => ({
    id: relation.id,
    itemId: relation.outputGroupId,
    name:
      relation.outputGroupName ||
      t('cfg.relations.output_group_fallback', { id: relation.outputGroupId }),
    description: relation.outputGroupDescription,
    isDefault: relation.isDefault === 1,
  }));

const mapSolverRelations = (relations: SimTypeSolverRel[], t: Translator): RelationCardItem[] =>
  relations.map(relation => ({
    id: relation.id,
    itemId: relation.solverId,
    name: relation.solverName || t('cfg.relations.solver_fallback', { id: relation.solverId }),
    description: relation.solverCode ? `${relation.solverCode} | v${relation.solverVersion}` : '',
    isDefault: relation.isDefault === 1,
  }));

export const ConfigRelationsManagement: React.FC = () => {
  const { t } = useI18n();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
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

  const translatedTabs = useMemo<RelationTabConfig[]>(
    () =>
      RELATION_TAB_KEYS.map(item => ({
        tab: item.tab,
        label: t(item.labelKey),
        title: t(item.titleKey),
        emptyText: t(item.emptyTextKey),
        addTitle: t(item.addTitleKey),
      })),
    [t]
  );

  const loadSimTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await configApi.getSimTypes();
      setSimTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load simulation types:', error);
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
      console.error('Failed to load relation config options:', error);
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
      console.error('Failed to load relation config:', error);
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
      paramGroups: mapParamGroupRelations(paramGroupRelations, t),
      outputGroups: mapOutputGroupRelations(outputGroupRelations, t),
      solvers: mapSolverRelations(solverRelations, t),
    }),
    [outputGroupRelations, paramGroupRelations, solverRelations, t]
  );

  const modalItems = useMemo(
    () => ({
      paramGroups: allParamGroups,
      outputGroups: allOutputGroups,
      solvers: allSolvers,
    }),
    [allOutputGroups, allParamGroups, allSolvers]
  );

  const activeTabConfig = translatedTabs.find(item => item.tab === activeTab) || translatedTabs[0];
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
        console.error('Failed to add relation config:', error);
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
        console.error('Failed to set default relation:', error);
      }
    },
    [activeTab, refreshCurrentTab, selectedSimType]
  );

  const handleRemoveRelation = useCallback(
    (itemId: number) => {
      if (!selectedSimType) return;

      showConfirm(
        t('common.confirm'),
        t('cfg.relations.remove_confirm'),
        async () => {
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
            console.error('Failed to remove relation:', error);
          }
        },
        'danger'
      );
    },
    [activeTab, refreshCurrentTab, selectedSimType, showConfirm, t]
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
            <div className="p-12 text-center text-slate-500">
              {t('cfg.relations.select_sim_type_tip')}
            </div>
          </Card>
        ) : (
          <>
            <RelationTabBar activeTab={activeTab} tabs={translatedTabs} onChange={setActiveTab} />
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
          title={
            translatedTabs.find(item => item.tab === activeModalTab)?.addTitle ||
            t('cfg.relations.add_relation')
          }
          items={modalItems[activeModalTab]}
          existingIds={existingIds}
          onAdd={handleAddRelation}
          onClose={() => setActiveModalTab(null)}
          getItemLabel={getModalItemLabel}
          getItemSubLabel={getModalItemSubLabel}
        />
      )}
      <ConfirmDialogComponent />
    </div>
  );
};
