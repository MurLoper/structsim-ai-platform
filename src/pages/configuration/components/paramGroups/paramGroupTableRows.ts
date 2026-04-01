import type { ParamGroup, ParamInGroup } from '@/types/configGroups';

export interface ParamGroupTableRow {
  group: ParamGroup;
  param: ParamInGroup | null;
  rowSpan: number;
  isFirstRow: boolean;
}

type BuildParamGroupTableRowsOptions = {
  groups: ParamGroup[];
  groupParamsMap: Map<number, ParamInGroup[]>;
  searchTerm: string;
  filterProjectId: number | '';
};

export const buildParamGroupTableRows = ({
  groups,
  groupParamsMap,
  searchTerm,
  filterProjectId,
}: BuildParamGroupTableRowsOptions): ParamGroupTableRow[] => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const rows: ParamGroupTableRow[] = [];

  const filteredGroups = groups.filter(group => {
    if (filterProjectId !== '') {
      const projectIds = group.projectIds || [];
      if (filterProjectId === -1) {
        if (projectIds.length > 0) {
          return false;
        }
      } else if (projectIds.length > 0 && !projectIds.includes(filterProjectId as number)) {
        return false;
      }
    }

    if (!normalizedSearch) {
      return true;
    }

    const nameMatch = group.name.toLowerCase().includes(normalizedSearch);
    const paramMatch = (groupParamsMap.get(group.id) || []).some(
      item =>
        item.paramName?.toLowerCase().includes(normalizedSearch) ||
        item.paramKey?.toLowerCase().includes(normalizedSearch)
    );

    return nameMatch || paramMatch;
  });

  filteredGroups.forEach(group => {
    const params = groupParamsMap.get(group.id) || [];

    if (params.length === 0) {
      rows.push({ group, param: null, rowSpan: 1, isFirstRow: true });
      return;
    }

    const matchedParams = normalizedSearch
      ? params.filter(
          item =>
            item.paramName?.toLowerCase().includes(normalizedSearch) ||
            item.paramKey?.toLowerCase().includes(normalizedSearch)
        )
      : params;

    const displayParams = matchedParams.length > 0 ? matchedParams : params;
    displayParams.forEach((param, index) => {
      rows.push({
        group,
        param,
        rowSpan: index === 0 ? displayParams.length : 0,
        isFirstRow: index === 0,
      });
    });
  });

  return rows;
};
