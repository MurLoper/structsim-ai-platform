/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_RESULT_ASSET_DOMAIN_URL?: string;
  readonly VITE_RESULT_ASSET_PROXY_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'echarts-gl/charts' {
  import type { EChartsExtensionInstallRegisters } from 'echarts/types/dist/shared';

  export const Scatter3DChart: (registers: EChartsExtensionInstallRegisters) => void;
  export const Bar3DChart: (registers: EChartsExtensionInstallRegisters) => void;
  export const SurfaceChart: (registers: EChartsExtensionInstallRegisters) => void;
}

declare module 'echarts-gl/components' {
  import type { EChartsExtensionInstallRegisters } from 'echarts/types/dist/shared';

  export const Grid3DComponent: (registers: EChartsExtensionInstallRegisters) => void;
}
