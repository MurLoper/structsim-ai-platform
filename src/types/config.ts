// Configuration types - 匹配后端新数据模型

export interface Project {
  id: number;
  name: string;
  code: string;
  defaultSimTypeId: number;
  defaultSolverId: number;
  valid: number;
  sort: number;
  remark: string;
  createdAt: number;
  updatedAt: number;
}

// 旧类型保留兼容（逐步废弃）
export interface AttitudeConfig {
  id: number;
  name: string;
  code: string;
}

export interface StatusConfig {
  id: string;
  name: string;
  color: string;
  type: 'process' | 'final';
}

export interface AutomationModule {
  id: string;
  name: string;
  category: string;
  version: string;
}

export interface WorkflowStep {
  id: string;
  moduleId: string;
  name: string;
  order: number;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  type: 'request' | 'simulation' | 'iteration';
  steps: WorkflowStep[];
}

export interface BaseParameter {
  id: string;
  name: string;
  type: string;
  defaultMin?: number;
  defaultMax?: number;
  defaultOptions?: string[];
  defaultValue?: string | number;
}

export interface BaseLoadCase {
  id: string;
  name: string;
  description?: string;
}

export interface BaseOutput {
  id: string;
  name: string;
  unit?: string;
}

export interface ProjectSimMapping {
  id: string;
  projectId: string;
  simType: string;
  enabled: boolean;
  defaultWorkflowId?: string;
  isDefault?: boolean;
}

export interface ParameterTemplate {
  id: string;
  name: string;
  projectId: string;
  simType: string;
  parameters: Parameter[];
}

export interface OutputSet {
  id: string;
  name: string;
  projectId: string;
  simType: string;
  loadCases: string[];
  outputs: string[];
}

export interface Parameter {
  id: string;
  name: string;
  type: string;
  value?: string | number;
  min?: number;
  max?: number;
  options?: string[];
}
