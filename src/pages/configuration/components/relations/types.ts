import type { OutputGroup, ParamGroup } from '@/types/configGroups';
import type { SimType, Solver } from '@/types/config';

export type RelationTab = 'paramGroups' | 'outputGroups' | 'solvers';

export interface RelationCardItem {
  id: number;
  itemId: number;
  name: string;
  description?: string;
  isDefault: boolean;
}

export type SelectableRelationItem = ParamGroup | OutputGroup | Solver;

export interface RelationTabConfig {
  tab: RelationTab;
  label: string;
  title: string;
  emptyText: string;
  addTitle: string;
}

export interface SimTypeListProps {
  loading: boolean;
  simTypes: SimType[];
  selectedSimType: SimType | null;
  onSelect: (simType: SimType) => void;
}
