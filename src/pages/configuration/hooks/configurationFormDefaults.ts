export type ConfigurationModalType =
  | 'project'
  | 'simType'
  | 'paramDef'
  | 'solver'
  | 'conditionDef'
  | 'outputDef'
  | 'foldType'
  | 'careDevice';

export const getConfigurationDefaultFormData = (
  type: ConfigurationModalType
): Record<string, unknown> => {
  switch (type) {
    case 'project':
      return { name: '', code: '', sort: 100, remark: '' };
    case 'simType':
      return { name: '', code: '', category: 'STRUCTURE', colorTag: 'blue', sort: 100 };
    case 'paramDef':
      return {
        name: '',
        key: '',
        valType: 1,
        unit: '',
        minVal: 0,
        maxVal: 100,
        defaultVal: '',
        precision: 3,
        sort: 100,
      };
    case 'solver':
      return {
        name: '',
        code: '',
        version: '2024',
        cpuCoreMin: 1,
        cpuCoreMax: 64,
        cpuCoreDefault: 8,
        memoryMin: 1,
        memoryMax: 1024,
        memoryDefault: 64,
        sort: 100,
      };
    case 'conditionDef':
      return { name: '', code: '', category: '', unit: '', sort: 100, remark: '' };
    case 'outputDef':
      return { name: '', code: '', unit: '', dataType: 'float', sort: 100, remark: '' };
    case 'foldType':
      return { name: '', code: '', angle: 0, sort: 100, remark: '' };
    case 'careDevice':
      return { name: '', code: '', category: '', sort: 100, remark: '' };
    default:
      return {};
  }
};
