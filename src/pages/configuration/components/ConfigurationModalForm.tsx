import React from 'react';
import { FormInput, FormSelect } from './EditModal';

const CATEGORY_OPTIONS = [
  { value: 'STRUCTURE', label: '结构' },
  { value: 'THERMAL', label: '热分析' },
  { value: 'DYNAMIC', label: '动力学' },
  { value: 'ACOUSTIC', label: '声学' },
];

interface ConfigurationModalFormProps {
  modalType?: string | null;
  formData: Record<string, unknown>;
  updateFormData: (field: string, value: unknown) => void;
}

const textareaClassName =
  'w-full rounded-lg border p-2 dark:border-slate-600 dark:bg-slate-700 eyecare:border-border eyecare:bg-card';

const renderTextarea = (
  value: string,
  onChange: (value: string) => void,
  placeholder: string,
  rows = 2
) => (
  <textarea
    value={value}
    onChange={event => onChange(event.target.value)}
    placeholder={placeholder}
    rows={rows}
    className={textareaClassName}
  />
);

export const ConfigurationModalForm = ({
  modalType,
  formData,
  updateFormData,
}: ConfigurationModalFormProps) => {
  if (modalType === 'simType') {
    return (
      <>
        <FormInput
          label="名称"
          value={String(formData.name || '')}
          onChange={v => updateFormData('name', v)}
        />
        <FormInput
          label="编码"
          value={String(formData.code || '')}
          onChange={v => updateFormData('code', v)}
        />
        <FormSelect
          label="分类"
          value={String(formData.category || 'STRUCTURE')}
          onChange={v => updateFormData('category', v)}
          options={CATEGORY_OPTIONS}
        />
        <FormInput
          label="排序"
          value={Number(formData.sort ?? 100)}
          onChange={v => updateFormData('sort', Number(v))}
          type="number"
        />
      </>
    );
  }

  if (modalType === 'paramDef') {
    return (
      <>
        <FormInput
          label="名称"
          value={String(formData.name || '')}
          onChange={v => updateFormData('name', v)}
          placeholder="请输入参数名称"
        />
        <FormInput
          label="Key"
          value={String(formData.key || '')}
          onChange={v => updateFormData('key', v)}
          placeholder="请输入参数键名（英文）"
        />
        <FormSelect
          label="数据类型"
          value={String(formData.valType || 1)}
          onChange={v => updateFormData('valType', Number(v))}
          options={[
            { value: '1', label: '浮点数' },
            { value: '2', label: '整数' },
            { value: '3', label: '字符串' },
            { value: '4', label: '枚举' },
            { value: '5', label: '布尔' },
          ]}
        />
        <FormInput
          label="单位"
          value={String(formData.unit || '')}
          onChange={v => updateFormData('unit', v)}
          placeholder="如：mm, kg, MPa"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="最小值"
            value={Number(formData.minVal ?? 0)}
            onChange={v => updateFormData('minVal', Number(v))}
            type="number"
          />
          <FormInput
            label="最大值"
            value={Number(formData.maxVal ?? 100)}
            onChange={v => updateFormData('maxVal', Number(v))}
            type="number"
          />
        </div>
        <FormInput
          label="默认值"
          value={String(formData.defaultVal || '')}
          onChange={v => updateFormData('defaultVal', v)}
          placeholder="请输入默认值"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="精度"
            value={Number(formData.precision ?? 3)}
            onChange={v => updateFormData('precision', Number(v))}
            type="number"
          />
          <FormInput
            label="排序"
            value={Number(formData.sort ?? 100)}
            onChange={v => updateFormData('sort', Number(v))}
            type="number"
          />
        </div>
      </>
    );
  }

  if (modalType === 'solver') {
    return (
      <>
        <FormInput
          label="名称"
          value={String(formData.name || '')}
          onChange={v => updateFormData('name', v)}
          placeholder="请输入求解器名称"
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="编码"
            value={String(formData.code || '')}
            onChange={v => updateFormData('code', v)}
            placeholder="如：NASTRAN"
          />
          <FormInput
            label="版本"
            value={String(formData.version || '')}
            onChange={v => updateFormData('version', v)}
            placeholder="如：2024"
          />
        </div>
        <div className="mt-2 border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            CPU 核数配置
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="最小核数"
              value={Number(formData.cpuCoreMin ?? 1)}
              onChange={v => updateFormData('cpuCoreMin', Number(v))}
              type="number"
            />
            <FormInput
              label="最大核数"
              value={Number(formData.cpuCoreMax ?? 64)}
              onChange={v => updateFormData('cpuCoreMax', Number(v))}
              type="number"
            />
            <FormInput
              label="默认核数"
              value={Number(formData.cpuCoreDefault ?? 8)}
              onChange={v => updateFormData('cpuCoreDefault', Number(v))}
              type="number"
            />
          </div>
        </div>
        <div className="mt-2 border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            内存配置（GB）
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label="最小内存"
              value={Number(formData.memoryMin ?? 1)}
              onChange={v => updateFormData('memoryMin', Number(v))}
              type="number"
            />
            <FormInput
              label="最大内存"
              value={Number(formData.memoryMax ?? 1024)}
              onChange={v => updateFormData('memoryMax', Number(v))}
              type="number"
            />
            <FormInput
              label="默认内存"
              value={Number(formData.memoryDefault ?? 64)}
              onChange={v => updateFormData('memoryDefault', Number(v))}
              type="number"
            />
          </div>
        </div>
        <FormInput
          label="排序"
          value={Number(formData.sort ?? 100)}
          onChange={v => updateFormData('sort', Number(v))}
          type="number"
        />
      </>
    );
  }

  if (modalType === 'conditionDef') {
    return (
      <>
        <FormInput
          label="名称"
          value={String(formData.name || '')}
          onChange={v => updateFormData('name', v)}
          placeholder="请输入工况名称"
        />
        <FormInput
          label="编码"
          value={String(formData.code || '')}
          onChange={v => updateFormData('code', v)}
          placeholder="请输入工况编码"
        />
        <FormInput
          label="分类"
          value={String(formData.category || '')}
          onChange={v => updateFormData('category', v)}
          placeholder="如：载荷、约束等"
        />
        <FormInput
          label="单位"
          value={String(formData.unit || '')}
          onChange={v => updateFormData('unit', v)}
          placeholder="如：N, MPa"
        />
        <FormInput
          label="排序"
          value={Number(formData.sort ?? 100)}
          onChange={v => updateFormData('sort', Number(v))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            备注
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            '请输入备注信息（可选）'
          )}
        </div>
      </>
    );
  }

  if (modalType === 'outputDef') {
    return (
      <>
        <FormInput
          label="名称"
          value={String(formData.name || '')}
          onChange={v => updateFormData('name', v)}
          placeholder="请输入输出名称"
        />
        <FormInput
          label="编码"
          value={String(formData.code || '')}
          onChange={v => updateFormData('code', v)}
          placeholder="请输入输出编码"
        />
        <FormInput
          label="单位"
          value={String(formData.unit || '')}
          onChange={v => updateFormData('unit', v)}
          placeholder="如：mm, MPa, Hz"
        />
        <FormSelect
          label="数据类型"
          value={String(formData.dataType || 'float')}
          onChange={v => updateFormData('dataType', v)}
          options={[
            { value: 'float', label: '浮点数' },
            { value: 'int', label: '整数' },
            { value: 'string', label: '字符串' },
          ]}
        />
        <FormInput
          label="排序"
          value={Number(formData.sort ?? 100)}
          onChange={v => updateFormData('sort', Number(v))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            备注
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            '请输入备注信息（可选）'
          )}
        </div>
      </>
    );
  }

  if (modalType === 'foldType') {
    return (
      <>
        <FormInput
          label="名称"
          value={String(formData.name || '')}
          onChange={v => updateFormData('name', v)}
          placeholder="请输入姿态名称"
        />
        <FormInput
          label="编码"
          value={String(formData.code || '')}
          onChange={v => updateFormData('code', v)}
          placeholder="请输入姿态编码"
        />
        <FormInput
          label="角度"
          value={Number(formData.angle ?? 0)}
          onChange={v => updateFormData('angle', Number(v))}
          type="number"
          placeholder="请输入角度值"
        />
        <FormInput
          label="排序"
          value={Number(formData.sort ?? 100)}
          onChange={v => updateFormData('sort', Number(v))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            备注
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            '请输入备注信息（可选）'
          )}
        </div>
      </>
    );
  }

  if (modalType === 'project') {
    return (
      <>
        <FormInput
          label="项目名称"
          value={String(formData.name || '')}
          onChange={v => updateFormData('name', v)}
          placeholder="请输入项目名称"
        />
        <FormInput
          label="项目编码"
          value={String(formData.code || '')}
          onChange={v => updateFormData('code', v)}
          placeholder="请输入项目编码（可选）"
        />
        <FormInput
          label="排序"
          value={Number(formData.sort ?? 100)}
          onChange={v => updateFormData('sort', Number(v))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300 eyecare:text-foreground">
            备注
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            '请输入备注信息（可选）',
            3
          )}
        </div>
      </>
    );
  }

  return null;
};
