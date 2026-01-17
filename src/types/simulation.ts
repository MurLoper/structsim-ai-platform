// Simulation types
import { SimulationType, ParamStrategy } from './enums';
import { Parameter, ProcessState } from './index';

export interface OptimizationConfig {
  strategy: ParamStrategy;
  rounds: number;
  samples: number;
  targetMetric?: string;
}

export interface SolverConfig {
  version: string;
  processors: number;
  memory: number;
  precision: 'SINGLE' | 'DOUBLE';
  timeStep?: number;
}

export interface SimConfiguration {
  id: string;
  type: SimulationType;
  isActive: boolean;
  templateId?: string;
  outputSetId?: string;
  workflowId?: string;
  parameters: Parameter[];
  selectedLoadCases: string[];
  optConfig: OptimizationConfig;
  outputMetrics: string[];
  solverConfig: SolverConfig;
}

export interface SubmissionRequest {
  id: string;
  projectId: string;
  projectNameSnapshot: string;
  workflowId: string;
  process: ProcessState;
  configurations: SimConfiguration[];
  createdAt: string;
  sourceType: 'path' | 'id' | 'file';
  sourceValue: string;
  attitudeId: number;
  participantIds: string[];
  remarks: string;
}

export interface IterationResult {
  iterationId: number;
  process: ProcessState;
  params: Record<string, number | string>;
  outputs: Record<string, number>;
}

export interface SimulationResult {
  simConfigId: string;
  simType: SimulationType;
  process: ProcessState;
  results: IterationResult[];
  bestIterationId?: number;
}
