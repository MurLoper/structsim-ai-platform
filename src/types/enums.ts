// Enums
export enum SimulationType {
  STATIC = 'Static Structural',
  DYNAMIC = 'Transient Dynamic',
  THERMAL = 'Thermal Analysis',
  FLUID = 'CFD Fluid',
  NVH = 'NVH Analysis',
}

export enum ParamStrategy {
  DOE = 'DOE (Design of Experiments)',
  BAYESIAN = 'Bayesian Optimization',
}

export enum ParamType {
  DISCRETE = 'Discrete',
  CONTINUOUS = 'Continuous',
  FIXED = 'Fixed',
}
