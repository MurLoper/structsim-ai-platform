import React from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { FormField } from '@/components/forms/FormField';
import type { Project } from '@/types';
import type { FoldType } from '@/api/config';
import type { SubmissionFormValues } from '../types';

interface ProjectDrawerContentProps {
  projects: Project[];
  foldTypes: FoldType[];
  control: Control<SubmissionFormValues>;
  setValue: UseFormSetValue<SubmissionFormValues>;
  t: (key: string) => string;
}

export const ProjectDrawerContent: React.FC<ProjectDrawerContentProps> = ({
  projects,
  foldTypes,
  control,
  setValue,
  t,
}) => {
  const originType = useWatch({ control, name: 'originFile.type' }) ?? 1;
  const originPath = useWatch({ control, name: 'originFile.path' }) ?? '';
  const originName = useWatch({ control, name: 'originFile.name' }) ?? '';

  const handleOriginTypeChange = (type: number) => {
    setValue('originFile.type', type, { shouldValidate: true, shouldDirty: true });
    if (type !== 3 && originName) {
      setValue('originFile.name', '', { shouldValidate: true, shouldDirty: true });
    }
    if (type === 3 && originPath) {
      setValue('originFile.path', '', { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="projectId"
        label={t('sub.sel_project')}
        required
        render={({ field }) => (
          <select
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            value={field.value ?? ''}
            onChange={e => field.onChange(Number(e.target.value) || null)}
          >
            <option value="">-- 请选择项目 --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        )}
      />

      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          {t('sub.source_geo')}
        </label>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-3">
          {[
            { v: 1, l: '路径' },
            { v: 2, l: 'ID' },
            { v: 3, l: '上传' },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => handleOriginTypeChange(opt.v)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                originType === opt.v
                  ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                  : 'text-slate-500'
              }`}
              type="button"
            >
              {opt.l}
            </button>
          ))}
        </div>

        {originType === 3 ? (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
              <ArrowUpTrayIcon className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-500 text-sm">拖拽文件到此处或点击上传</p>
            </div>
            <FormField
              control={control}
              name="originFile.name"
              label="上传文件名"
              required
              render={({ field }) => (
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                  placeholder="输入文件名..."
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        ) : (
          <FormField
            control={control}
            name="originFile.path"
            label={originType === 1 ? '源文件路径' : '源文件ID'}
            required
            render={({ field }) => (
              <input
                type="text"
                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                placeholder={originType === 1 ? '输入文件路径...' : '输入文件ID...'}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        )}
      </div>

      <FormField
        control={control}
        name="foldTypeId"
        label="折叠类型 (姿态)"
        required
        render={({ field }) => (
          <select
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            value={field.value ?? ''}
            onChange={e => field.onChange(Number(e.target.value) || '')}
          >
            {foldTypes.map(ft => (
              <option key={ft.id} value={ft.id}>
                {ft.name} ({ft.angle}°)
              </option>
            ))}
          </select>
        )}
      />

      <FormField
        control={control}
        name="remark"
        label={t('sub.remarks')}
        render={({ field }) => (
          <textarea
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 h-24 resize-none"
            placeholder="输入备注信息..."
            value={field.value || ''}
            onChange={field.onChange}
          />
        )}
      />
    </div>
  );
};
