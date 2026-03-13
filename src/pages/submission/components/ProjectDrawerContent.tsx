import React, { useState } from 'react';
import { useWatch, type Control, type UseFormSetValue, type FieldValues } from 'react-hook-form';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui';
import { ChunkedUpload } from '@/components/FileUpload/ChunkedUpload';
import type { Project, User } from '@/types';
import type { FoldType } from '@/api/config';
import type { SubmissionFormValues, InpSetInfo } from '../types';
import { ModelLevel } from '../types';

interface ProjectDrawerContentProps {
  projects: Project[];
  foldTypes: FoldType[];
  users?: User[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<SubmissionFormValues, any>;
  setValue: UseFormSetValue<SubmissionFormValues>;
  t: (key: string) => string;
  onVerifyFile?: (
    path: string,
    type: number
  ) => Promise<{
    success: boolean;
    name?: string;
    path?: string;
    inpSets?: InpSetInfo[];
    error?: string;
  }>;
}

export const ProjectDrawerContent: React.FC<ProjectDrawerContentProps> = ({
  projects,
  foldTypes,
  users = [],
  control,
  setValue,
  t,
  onVerifyFile,
}) => {
  const originType = useWatch({ control, name: 'originFile.type' }) ?? 1;
  const originPath = useWatch({ control, name: 'originFile.path' }) ?? '';
  const originName = useWatch({ control, name: 'originFile.name' }) ?? '';
  const originVerified = useWatch({ control, name: 'originFile.verified' }) ?? false;
  const originVerifiedName = useWatch({ control, name: 'originFile.verifiedName' }) ?? '';
  const modelLevelId = useWatch({ control, name: 'modelLevelId' }) ?? ModelLevel.WHOLE;

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [inpSets, setInpSets] = useState<InpSetInfo[]>([]);

  // 类型转换以兼容 FormField
  const formControl = control as unknown as Control<FieldValues>;

  const handleOriginTypeChange = (type: number) => {
    setValue('originFile.type', type, { shouldValidate: true, shouldDirty: true });
    setValue('originFile.verified', false);
    setVerifyError(null);
    setInpSets([]);
    if (type !== 3 && originName) {
      setValue('originFile.name', '', { shouldValidate: true, shouldDirty: true });
    }
    if (type === 3 && originPath) {
      setValue('originFile.path', '', { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleVerifyFile = async () => {
    if (!originPath && originType !== 3) return;
    if (!onVerifyFile) return;

    setVerifying(true);
    setVerifyError(null);

    try {
      const result = await onVerifyFile(originPath, originType);
      if (result.success) {
        setValue('originFile.verified', true);
        setValue('originFile.verifiedName', result.name);
        setValue('originFile.verifiedPath', result.path);
        if (result.inpSets) {
          setInpSets(result.inpSets);
        }
      } else {
        setVerifyError(result.error || t('sub.file_verify_fail'));
        setValue('originFile.verified', false);
      }
    } catch {
      setVerifyError(t('sub.verify_request_fail'));
      setValue('originFile.verified', false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={formControl}
        name="projectId"
        label={t('sub.sel_project')}
        required
        render={({ field }) => (
          <select
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            value={field.value ?? ''}
            onChange={e => field.onChange(Number(e.target.value) || null)}
          >
            <option value="">-- {t('sub.sel_project')} --</option>
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
            { v: 1, l: t('sub.source_type_path') },
            { v: 2, l: t('sub.source_type_id') },
            { v: 3, l: t('sub.source_type_upload') },
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
            {originName ? (
              /* 已上传文件显示 */
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg">
                <DocumentIcon className="w-8 h-8 text-brand-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {originName}
                  </p>
                  <p className="text-xs text-slate-500">{t('sub.file_uploaded')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue('originFile.name', '', { shouldValidate: true, shouldDirty: true });
                    setValue('originFile.path', '', { shouldValidate: true, shouldDirty: true });
                  }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                  title={t('sub.delete_file')}
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            ) : (
              /* 上传区域 */
              <ChunkedUpload
                onSuccess={(fileId, storagePath) => {
                  setValue('originFile.fileId', fileId, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue('originFile.path', storagePath, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue('originFile.name', storagePath.split('/').pop() || '', {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                accept=".zip,.rar,.7z,.step,.stp,.iges,.igs"
                maxSize={2147483648}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <FormField
              control={formControl}
              name="originFile.path"
              label={originType === 1 ? t('sub.source_file_path') : t('sub.source_file_id')}
              required
              render={({ field }) => (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    placeholder={
                      originType === 1 ? t('sub.input_file_path') : t('sub.input_file_id')
                    }
                    value={field.value || ''}
                    onChange={e => {
                      field.onChange(e);
                      setValue('originFile.verified', false);
                      setVerifyError(null);
                    }}
                  />
                  <Button
                    type="button"
                    variant={originVerified ? 'outline' : 'primary'}
                    onClick={handleVerifyFile}
                    disabled={verifying || !field.value}
                  >
                    {verifying
                      ? t('sub.file_verifying')
                      : originVerified
                        ? t('sub.file_verified')
                        : t('sub.file_verify')}
                  </Button>
                </div>
              )}
            />
            {/* 验证状态显示 */}
            {originVerified && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{t('sub.file_verify_success')}</span>
                {originVerifiedName && (
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                    - {originVerifiedName}
                  </span>
                )}
              </div>
            )}
            {verifyError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <ExclamationCircleIcon className="w-4 h-4" />
                <span>{verifyError}</span>
              </div>
            )}
            {/* INP文件set集显示 */}
            {inpSets.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs font-medium text-slate-500 mb-2">
                  {t('sub.inp_sets_detected')}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {inpSets.map((set, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded"
                    >
                      {set.type}: {set.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <FormField
        control={formControl}
        name="originFoldTypeId"
        label={t('sub.origin_fold_type')}
        render={({ field }) => (
          <select
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            value={field.value ?? ''}
            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- {t('sub.origin_fold_type_select')} --</option>
            {foldTypes.map(ft => (
              <option key={ft.id} value={ft.id}>
                {ft.name} ({ft.angle}°)
              </option>
            ))}
          </select>
        )}
      />

      {/* 模型级别选择 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
          {t('sub.model_level')}
        </label>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {[
            { v: ModelLevel.WHOLE, l: t('sub.model_level_whole') },
            { v: ModelLevel.PART, l: t('sub.model_level_part') },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => setValue('modelLevelId', opt.v, { shouldValidate: true })}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                modelLevelId === opt.v
                  ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                  : 'text-slate-500'
              }`}
              type="button"
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {users.length > 0 && (
        <FormField
          control={formControl}
          name="participantIds"
          label={t('sub.participants_select')}
          render={({ field }) => {
            const selectedIds = field.value || [];
            // 已选中的用户排在前面
            const sortedUsers = [...users].sort((a, b) => {
              const aSelected = selectedIds.includes(a.id);
              const bSelected = selectedIds.includes(b.id);
              if (aSelected && !bSelected) return -1;
              if (!aSelected && bSelected) return 1;
              return 0;
            });
            return (
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 dark:border-slate-600">
                {sortedUsers.map(user => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            field.onChange([...selectedIds, user.id]);
                          } else {
                            field.onChange(selectedIds.filter((id: number) => id !== user.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="flex-1 text-sm">{user.name || user.username}</span>
                    </label>
                  );
                })}
              </div>
            );
          }}
        />
      )}

      <FormField
        control={formControl}
        name="remark"
        label={t('sub.remarks')}
        render={({ field }) => (
          <textarea
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 h-24 resize-none"
            placeholder={t('sub.input_remark')}
            value={field.value || ''}
            onChange={field.onChange}
          />
        )}
      />
    </div>
  );
};
