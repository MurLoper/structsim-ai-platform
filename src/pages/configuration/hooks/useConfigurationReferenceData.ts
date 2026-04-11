import {
  useProjects,
  useParamDefs,
  useWorkflows,
  useSimTypes,
  useSolvers,
  useConditionDefs,
  useOutputDefs,
  useFoldTypes,
  useCareDevices,
} from '@/features/config/queries';

export const useConfigurationReferenceData = () => {
  const { data: projects = [] } = useProjects();
  const { data: paramDefs = [] } = useParamDefs();
  const { data: workflows = [] } = useWorkflows();
  const { data: simTypes = [] } = useSimTypes();
  const { data: solvers = [] } = useSolvers();
  const { data: conditionDefs = [] } = useConditionDefs();
  const { data: outputDefs = [] } = useOutputDefs();
  const { data: foldTypes = [] } = useFoldTypes();
  const { data: careDevices = [] } = useCareDevices();

  return {
    projects,
    paramDefs,
    workflows,
    simTypes,
    solvers,
    conditionDefs,
    outputDefs,
    foldTypes,
    careDevices,
  };
};
