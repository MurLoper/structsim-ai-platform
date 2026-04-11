import { useMemo } from 'react';
import { useI18n } from '@/hooks';
import { FormInput, FormSelect } from './EditModal';

interface ConfigurationModalFormProps {
  modalType?: string | null;
  formData: Record<string, unknown>;
  updateFormData: (field: string, value: unknown) => void;
}

const textareaClassName =
  'w-full rounded-lg border border-input bg-background p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

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
  const { t } = useI18n();

  const categoryOptions = useMemo(
    () => [
      { value: 'STRUCTURE', label: t('cfg.category.structure') },
      { value: 'THERMAL', label: t('cfg.category.thermal') },
      { value: 'DYNAMIC', label: t('cfg.category.dynamic') },
      { value: 'ACOUSTIC', label: t('cfg.category.acoustic') },
    ],
    [t]
  );

  const paramDataTypeOptions = useMemo(
    () => [
      { value: '1', label: t('cfg.data_type.float') },
      { value: '2', label: t('cfg.data_type.int') },
      { value: '3', label: t('cfg.data_type.string') },
      { value: '4', label: t('cfg.data_type.enum') },
      { value: '5', label: t('cfg.data_type.boolean') },
    ],
    [t]
  );

  const outputDataTypeOptions = useMemo(
    () => [
      { value: 'float', label: t('cfg.data_type.float') },
      { value: 'int', label: t('cfg.data_type.int') },
      { value: 'string', label: t('cfg.data_type.string') },
    ],
    [t]
  );

  if (modalType === 'simType') {
    return (
      <>
        <FormInput
          label={t('common.name')}
          value={String(formData.name || '')}
          onChange={value => updateFormData('name', value)}
        />
        <FormInput
          label={t('common.code')}
          value={String(formData.code || '')}
          onChange={value => updateFormData('code', value)}
        />
        <FormSelect
          label={t('cfg.category')}
          value={String(formData.category || 'STRUCTURE')}
          onChange={value => updateFormData('category', value)}
          options={categoryOptions}
        />
        <FormInput
          label={t('common.sort')}
          value={Number(formData.sort ?? 100)}
          onChange={value => updateFormData('sort', Number(value))}
          type="number"
        />
      </>
    );
  }

  if (modalType === 'paramDef') {
    return (
      <>
        <FormInput
          label={t('common.name')}
          value={String(formData.name || '')}
          onChange={value => updateFormData('name', value)}
          placeholder={t('cfg.params.name_placeholder')}
        />
        <FormInput
          label={t('common.key')}
          value={String(formData.key || '')}
          onChange={value => updateFormData('key', value)}
          placeholder={t('cfg.params.key_placeholder')}
        />
        <FormSelect
          label={t('cfg.params.val_type')}
          value={String(formData.valType || 1)}
          onChange={value => updateFormData('valType', Number(value))}
          options={paramDataTypeOptions}
        />
        <FormInput
          label={t('common.unit')}
          value={String(formData.unit || '')}
          onChange={value => updateFormData('unit', value)}
          placeholder={t('cfg.params.unit_placeholder')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label={t('cfg.params.min')}
            value={Number(formData.minVal ?? 0)}
            onChange={value => updateFormData('minVal', Number(value))}
            type="number"
          />
          <FormInput
            label={t('cfg.params.max')}
            value={Number(formData.maxVal ?? 100)}
            onChange={value => updateFormData('maxVal', Number(value))}
            type="number"
          />
        </div>
        <FormInput
          label={t('cfg.params.default')}
          value={String(formData.defaultVal || '')}
          onChange={value => updateFormData('defaultVal', value)}
          placeholder={t('cfg.params.default_placeholder')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Precision"
            value={Number(formData.precision ?? 3)}
            onChange={value => updateFormData('precision', Number(value))}
            type="number"
          />
          <FormInput
            label={t('common.sort')}
            value={Number(formData.sort ?? 100)}
            onChange={value => updateFormData('sort', Number(value))}
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
          label={t('common.name')}
          value={String(formData.name || '')}
          onChange={value => updateFormData('name', value)}
          placeholder={t('cfg.solver.name_placeholder')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label={t('common.code')}
            value={String(formData.code || '')}
            onChange={value => updateFormData('code', value)}
            placeholder={t('cfg.solver.code_placeholder')}
          />
          <FormInput
            label={t('cfg.solver.version')}
            value={String(formData.version || '')}
            onChange={value => updateFormData('version', value)}
            placeholder={t('cfg.solver.version_placeholder')}
          />
        </div>
        <div className="mt-2 border-t border-border pt-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">{t('cfg.solver.cpu_config')}</h4>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label={t('cfg.solver.cpu_min')}
              value={Number(formData.cpuCoreMin ?? 1)}
              onChange={value => updateFormData('cpuCoreMin', Number(value))}
              type="number"
            />
            <FormInput
              label={t('cfg.solver.cpu_max')}
              value={Number(formData.cpuCoreMax ?? 64)}
              onChange={value => updateFormData('cpuCoreMax', Number(value))}
              type="number"
            />
            <FormInput
              label={t('cfg.solver.cpu_default')}
              value={Number(formData.cpuCoreDefault ?? 8)}
              onChange={value => updateFormData('cpuCoreDefault', Number(value))}
              type="number"
            />
          </div>
        </div>
        <div className="mt-2 border-t border-border pt-4">
          <h4 className="mb-3 text-sm font-medium text-foreground">
            {t('cfg.solver.memory_config')}
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <FormInput
              label={t('cfg.solver.memory_min')}
              value={Number(formData.memoryMin ?? 1)}
              onChange={value => updateFormData('memoryMin', Number(value))}
              type="number"
            />
            <FormInput
              label={t('cfg.solver.memory_max')}
              value={Number(formData.memoryMax ?? 1024)}
              onChange={value => updateFormData('memoryMax', Number(value))}
              type="number"
            />
            <FormInput
              label={t('cfg.solver.memory_default')}
              value={Number(formData.memoryDefault ?? 64)}
              onChange={value => updateFormData('memoryDefault', Number(value))}
              type="number"
            />
          </div>
        </div>
        <FormInput
          label={t('common.sort')}
          value={Number(formData.sort ?? 100)}
          onChange={value => updateFormData('sort', Number(value))}
          type="number"
        />
      </>
    );
  }

  if (modalType === 'conditionDef') {
    return (
      <>
        <FormInput
          label={t('common.name')}
          value={String(formData.name || '')}
          onChange={value => updateFormData('name', value)}
          placeholder={t('cfg.condition.name_placeholder')}
        />
        <FormInput
          label={t('common.code')}
          value={String(formData.code || '')}
          onChange={value => updateFormData('code', value)}
          placeholder={t('cfg.condition.code_placeholder')}
        />
        <FormInput
          label={t('cfg.category')}
          value={String(formData.category || '')}
          onChange={value => updateFormData('category', value)}
          placeholder={t('cfg.placeholder.category')}
        />
        <FormInput
          label={t('common.unit')}
          value={String(formData.unit || '')}
          onChange={value => updateFormData('unit', value)}
          placeholder="e.g. N, MPa"
        />
        <FormInput
          label={t('common.sort')}
          value={Number(formData.sort ?? 100)}
          onChange={value => updateFormData('sort', Number(value))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('cfg.remark')}
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            t('cfg.remark_placeholder')
          )}
        </div>
      </>
    );
  }

  if (modalType === 'outputDef') {
    return (
      <>
        <FormInput
          label={t('common.name')}
          value={String(formData.name || '')}
          onChange={value => updateFormData('name', value)}
          placeholder={t('cfg.outputs.name_placeholder')}
        />
        <FormInput
          label={t('common.code')}
          value={String(formData.code || '')}
          onChange={value => updateFormData('code', value)}
          placeholder={t('cfg.outputs.code_placeholder')}
        />
        <FormInput
          label={t('common.unit')}
          value={String(formData.unit || '')}
          onChange={value => updateFormData('unit', value)}
          placeholder="e.g. mm, MPa, Hz"
        />
        <FormSelect
          label={t('cfg.outputs.data_type')}
          value={String(formData.dataType || 'float')}
          onChange={value => updateFormData('dataType', value)}
          options={outputDataTypeOptions}
        />
        <FormInput
          label={t('common.sort')}
          value={Number(formData.sort ?? 100)}
          onChange={value => updateFormData('sort', Number(value))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('cfg.remark')}
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            t('cfg.remark_placeholder')
          )}
        </div>
      </>
    );
  }

  if (modalType === 'foldType') {
    return (
      <>
        <FormInput
          label={t('common.name')}
          value={String(formData.name || '')}
          onChange={value => updateFormData('name', value)}
          placeholder={t('cfg.fold.name_placeholder')}
        />
        <FormInput
          label={t('common.code')}
          value={String(formData.code || '')}
          onChange={value => updateFormData('code', value)}
          placeholder={t('cfg.fold.code_placeholder')}
        />
        <FormInput
          label={t('cfg.fold.angle')}
          value={Number(formData.angle ?? 0)}
          onChange={value => updateFormData('angle', Number(value))}
          type="number"
          placeholder={t('cfg.fold.angle_placeholder')}
        />
        <FormInput
          label={t('common.sort')}
          value={Number(formData.sort ?? 100)}
          onChange={value => updateFormData('sort', Number(value))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('cfg.remark')}
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            t('cfg.remark_placeholder')
          )}
        </div>
      </>
    );
  }

  if (modalType === 'project') {
    return (
      <>
        <FormInput
          label={t('cfg.project.name')}
          value={String(formData.name || '')}
          onChange={value => updateFormData('name', value)}
          placeholder={t('cfg.project.name_placeholder')}
        />
        <FormInput
          label={t('cfg.project.code')}
          value={String(formData.code || '')}
          onChange={value => updateFormData('code', value)}
          placeholder={t('cfg.project.code_placeholder')}
        />
        <FormInput
          label={t('common.sort')}
          value={Number(formData.sort ?? 100)}
          onChange={value => updateFormData('sort', Number(value))}
          type="number"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('cfg.remark')}
          </label>
          {renderTextarea(
            String(formData.remark ?? ''),
            value => updateFormData('remark', value),
            t('cfg.remark_placeholder'),
            3
          )}
        </div>
      </>
    );
  }

  return null;
};
