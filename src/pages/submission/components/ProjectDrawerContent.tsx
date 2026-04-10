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
import type { Project } from '@/types';
import type { ParticipantCandidate, PhaseOption } from '@/types/configGroups';
import type { FoldType } from '@/api/config';
import type { SubmissionFormValues, InpSetInfo } from '../types';
import { ModelLevel } from '../types';

interface ProjectDrawerContentProps {
  projects: Project[];
  phases: PhaseOption[];
  foldTypes: FoldType[];
  participantCandidates?: ParticipantCandidate[];
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
  phases,
  foldTypes,
  participantCandidates = [],
  control,
  setValue,
  t,
  onVerifyFile,
}) => {
  const originType = useWatch({ control, name: 'originFile.type' }) ?? 1;
  const phaseId = useWatch({ control, name: 'phaseId' }) ?? null;
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
            className="w-full p-3 border rounded-lg bg-background text-foreground border-input"
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

      <FormField
        control={formControl}
        name="phaseId"
        label="项目阶段"
        render={({ field }) => (
          <select
            className="w-full p-3 border rounded-lg bg-background text-foreground border-input"
            value={field.value ?? ''}
            disabled={phases.length === 0}
            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">
              {phases.length > 0 ? '-- 请选择项目阶段 --' : '-- 当前项目无可用阶段 --'}
            </option>
            {phases.map(phase => (
              <option key={phase.phaseId} value={phase.phaseId}>
                {phase.phaseName}
              </option>
            ))}
          </select>
        )}
      />
      {phaseId && phases.length > 0 && (
        <p className="text-xs text-muted-foreground">
          已选择阶段：{phases.find(phase => phase.phaseId === phaseId)?.phaseName || phaseId}
        </p>
      )}

      <div>
        <label className="block text-sm font-bold mb-2 text-foreground">
          {t('sub.source_geo')}
        </label>
        <div className="flex bg-muted rounded-lg p-1 mb-3">
          {[
            { v: 1, l: t('sub.source_type_path') },
            { v: 2, l: t('sub.source_type_id') },
            { v: 3, l: t('sub.source_type_upload') },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => handleOriginTypeChange(opt.v)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                originType === opt.v ? 'bg-card shadow text-primary' : 'text-muted-foreground'
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
              <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                <DocumentIcon className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{originName}</p>
                  <p className="text-xs text-muted-foreground">{t('sub.file_uploaded')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue('originFile.name', '', { shouldValidate: true, shouldDirty: true });
                    setValue('originFile.path', '', { shouldValidate: true, shouldDirty: true });
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title={t('sub.delete_file')}
                >
                  <XMarkIcon className="w-5 h-5 text-muted-foreground" />
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
                    className="flex-1 p-3 border rounded-lg bg-background text-foreground border-input"
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
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>{t('sub.file_verify_success')}</span>
                {originVerifiedName && (
                  <span className="text-muted-foreground font-medium truncate">
                    - {originVerifiedName}
                  </span>
                )}
              </div>
            )}
            {verifyError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <ExclamationCircleIcon className="w-4 h-4" />
                <span>{verifyError}</span>
              </div>
            )}
            {/* INP文件set集显示 */}
            {inpSets.length > 0 && (
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t('sub.inp_sets_detected')}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {inpSets.map((set, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-xs bg-muted rounded">
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
            className="w-full p-3 border rounded-lg bg-background text-foreground border-input"
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
        <label className="block text-sm font-bold mb-2 text-foreground">
          {t('sub.model_level')}
        </label>
        <div className="flex bg-muted rounded-lg p-1">
          {[
            { v: ModelLevel.WHOLE, l: t('sub.model_level_whole') },
            { v: ModelLevel.PART, l: t('sub.model_level_part') },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => setValue('modelLevelId', opt.v, { shouldValidate: true })}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                modelLevelId === opt.v ? 'bg-card shadow text-primary' : 'text-muted-foreground'
              }`}
              type="button"
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {participantCandidates.length > 0 && (
        <FormField
          control={formControl}
          name="participantIds"
          label={t('sub.participants_select')}
          render={({ field }) => {
            const selectedIds = (field.value || []) as string[];
            const sortedUsers = [...participantCandidates].sort((a, b) => {
              const aIdentity = a.domainAccount || a.id || '';
              const bIdentity = b.domainAccount || b.id || '';
              const aSelected = selectedIds.includes(aIdentity);
              const bSelected = selectedIds.includes(bIdentity);
              if (aSelected && !bSelected) return -1;
              if (!aSelected && bSelected) return 1;
              const aFrequent = !!a.isProjectFrequent;
              const bFrequent = !!b.isProjectFrequent;
              if (aFrequent && !bFrequent) return -1;
              if (!aFrequent && bFrequent) return 1;
              return String(
                a.realName || a.userName || a.displayName || a.domainAccount || a.id || ''
              ).localeCompare(
                String(b.realName || b.userName || b.displayName || b.domainAccount || b.id || '')
              );
            });
            return (
              <div className="space-y-1 max-h-48 overflow-y-auto border border-input rounded-lg p-2">
                {sortedUsers.map(user => {
                  const userIdentity = user.domainAccount || user.id || '';
                  if (!userIdentity) return null;
                  const isSelected = selectedIds.includes(userIdentity);
                  return (
                    <label
                      key={userIdentity}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            field.onChange([...selectedIds, userIdentity]);
                          } else {
                            field.onChange(selectedIds.filter(id => id !== userIdentity));
                          }
                        }}
                        className="w-4 h-4 rounded border-input"
                      />
                      <span className="flex-1 text-sm">
                        {user.realName || user.userName || user.displayName || userIdentity}
                      </span>
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
            className="w-full p-3 border rounded-lg bg-background text-foreground border-input h-24 resize-none"
            placeholder={t('sub.input_remark')}
            value={field.value || ''}
            onChange={field.onChange}
          />
        )}
      />
    </div>
  );
};
