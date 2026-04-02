import type { OutputGroup, OutputInGroup } from '@/types/configGroups';

export interface OutputGroupTableRow {
  group: OutputGroup;
  output: OutputInGroup | null;
  rowSpan: number;
  isFirstRow: boolean;
  projectNames: string[];
  outputCount: number;
}

interface BuildOutputGroupTableRowsOptions {
  groups: OutputGroup[];
  projects: Array<{ id: number; name: string }>;
  groupOutputsMap: Map<number, OutputInGroup[]>;
  searchTerm: string;
  filterProjectId: number | '';
}

export const buildOutputGroupTableRows = ({
  groups,
  projects,
  groupOutputsMap,
  searchTerm,
  filterProjectId,
}: BuildOutputGroupTableRowsOptions): OutputGroupTableRow[] => {
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const rows: OutputGroupTableRow[] = [];

  const filteredGroups = groups.filter(group => {
    if (filterProjectId !== '') {
      const projectIds = group.projectIds || [];
      if (filterProjectId === -1) {
        if (projectIds.length > 0) return false;
      } else if (projectIds.length > 0 && !projectIds.includes(filterProjectId as number)) {
        return false;
      }
    }

    if (!normalizedTerm) return true;

    const outputs = groupOutputsMap.get(group.id) || [];
    const nameMatch = group.name.toLowerCase().includes(normalizedTerm);
    const outputMatch = outputs.some(
      item =>
        item.outputName?.toLowerCase().includes(normalizedTerm) ||
        item.outputCode?.toLowerCase().includes(normalizedTerm)
    );
    return nameMatch || outputMatch;
  });

  filteredGroups.forEach(group => {
    const outputs = groupOutputsMap.get(group.id) || [];
    const projectNames = (group.projectIds || []).map(
      projectId => projects.find(project => project.id === projectId)?.name || `项目 #${projectId}`
    );

    if (outputs.length === 0) {
      rows.push({
        group,
        output: null,
        rowSpan: 1,
        isFirstRow: true,
        projectNames,
        outputCount: 0,
      });
      return;
    }

    const visibleOutputs = normalizedTerm
      ? outputs.filter(
          item =>
            item.outputName?.toLowerCase().includes(normalizedTerm) ||
            item.outputCode?.toLowerCase().includes(normalizedTerm)
        )
      : outputs;

    const displayOutputs = visibleOutputs.length > 0 ? visibleOutputs : outputs;
    displayOutputs.forEach((output, index) => {
      rows.push({
        group,
        output,
        rowSpan: index === 0 ? displayOutputs.length : 0,
        isFirstRow: index === 0,
        projectNames,
        outputCount: outputs.length,
      });
    });
  });

  return rows;
};
