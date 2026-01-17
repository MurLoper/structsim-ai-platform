// Process state types
export interface StepExecution {
  stepId: string;
  statusId: string;
  startTime?: string;
  endTime?: string;
  logs?: string[];
}

export interface ProcessState {
  workflowId: string;
  currentStepIndex: number;
  steps: StepExecution[];
  statusId: string;
}
