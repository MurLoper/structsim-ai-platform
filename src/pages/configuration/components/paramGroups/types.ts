export interface ParamConfigItem {
  paramDefId: number;
  defaultValue: string;
  minVal: string;
  maxVal: string;
  enumValues: string;
  sort: number;
}

export interface ParamGroupFormData {
  [key: string]: unknown;
  name?: string;
  description?: string;
  projectIds?: number[];
  algType?: number;
  doeFileName?: string;
  doeFileHeads?: string[];
  doeFileData?: Array<Record<string, number | string>>;
  sort?: number;
  id?: number;
}
