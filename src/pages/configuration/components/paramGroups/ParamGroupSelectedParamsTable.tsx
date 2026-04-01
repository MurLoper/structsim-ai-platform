import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ParamDef } from '@/api';
import { managementTableInputClass } from '../managementSurfaceTokens';
import type { ParamConfigItem } from './types';

type ParamGroupSelectedParamsTableProps = {
  paramConfigs: ParamConfigItem[];
  getParamDef: (paramDefId: number) => ParamDef | undefined;
  onFieldChange: (paramDefId: number, field: keyof ParamConfigItem, value: string) => void;
  onRemoveParam: (paramDefId: number) => void;
};

export const ParamGroupSelectedParamsTable: React.FC<ParamGroupSelectedParamsTableProps> = ({
  paramConfigs,
  getParamDef,
  onFieldChange,
  onRemoveParam,
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <label className="text-sm font-medium">已选参数</label>
      <span className="text-xs text-slate-500">{paramConfigs.length} 个参数</span>
    </div>
    {paramConfigs.length > 0 ? (
      <div className="overflow-hidden rounded-lg border dark:border-slate-600">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase dark:bg-slate-700">
            <tr>
              <th className="px-2 py-2 text-left">参数名</th>
              <th className="px-2 py-2 text-left">Key</th>
              <th className="px-2 py-2 text-left">单位</th>
              <th className="px-2 py-2 text-left">下限</th>
              <th className="px-2 py-2 text-left">上限</th>
              <th className="px-2 py-2 text-left">默认值</th>
              <th className="px-2 py-2 text-left">枚举值（DOE）</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-600">
            {paramConfigs.map(config => {
              const definition = getParamDef(config.paramDefId);
              return (
                <tr
                  key={config.paramDefId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-2 py-1.5 text-xs font-medium">{definition?.name || '-'}</td>
                  <td className="px-2 py-1.5 font-mono text-xs text-slate-500">
                    {definition?.key || '-'}
                  </td>
                  <td className="px-2 py-1.5 text-xs text-slate-400">{definition?.unit || '-'}</td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={config.minVal}
                      onChange={e => onFieldChange(config.paramDefId, 'minVal', e.target.value)}
                      placeholder={definition?.minVal != null ? String(definition.minVal) : '-'}
                      className={managementTableInputClass}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={config.maxVal}
                      onChange={e => onFieldChange(config.paramDefId, 'maxVal', e.target.value)}
                      placeholder={definition?.maxVal != null ? String(definition.maxVal) : '-'}
                      className={managementTableInputClass}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={config.defaultValue}
                      onChange={e =>
                        onFieldChange(config.paramDefId, 'defaultValue', e.target.value)
                      }
                      placeholder={definition?.defaultVal || '--'}
                      className={managementTableInputClass}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={config.enumValues}
                      onChange={e => onFieldChange(config.paramDefId, 'enumValues', e.target.value)}
                      placeholder="如：0,15,30,45,60"
                      className={managementTableInputClass}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onRemoveParam(config.paramDefId)}
                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="rounded-lg border p-4 text-center text-sm text-slate-400 dark:border-slate-600">
        尚未选择参数，请从下方列表添加。
      </div>
    )}
  </div>
);
