import React from 'react';
import type { ParamGroupFormData } from './types';
import { managementFieldClass } from '../managementSurfaceTokens';

type ProjectOption = { id: number; name: string };

type ParamGroupBasicsSectionProps = {
  formData: ParamGroupFormData;
  projects: ProjectOption[];
  hasDoeFile: boolean;
  doePasteText: string;
  doeFileInputRef: React.RefObject<HTMLInputElement | null>;
  onFieldChange: (field: keyof ParamGroupFormData, value: unknown) => void;
  onDoePasteTextChange: (value: string) => void;
  onDoeTextareaPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onDoeFileSelected: (file: File) => void;
  onDownloadDoeFile: () => void;
  onClearDoeFile: () => void;
};

export const ParamGroupBasicsSection: React.FC<ParamGroupBasicsSectionProps> = ({
  formData,
  projects,
  hasDoeFile,
  doePasteText,
  doeFileInputRef,
  onFieldChange,
  onDoePasteTextChange,
  onDoeTextareaPaste,
  onDoeFileSelected,
  onDownloadDoeFile,
  onClearDoeFile,
}) => (
  <>
    <div>
      <label className="mb-1 block text-sm font-medium">名称 *</label>
      <input
        type="text"
        value={formData.name || ''}
        onChange={e => onFieldChange('name', e.target.value)}
        className={managementFieldClass}
        placeholder="输入组合名称"
      />
    </div>
    <div>
      <label className="mb-1 block text-sm font-medium">描述</label>
      <textarea
        value={formData.description || ''}
        onChange={e => onFieldChange('description', e.target.value)}
        className={managementFieldClass}
        rows={2}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">关联项目（可多选，不选则全局）</label>
        <div className="max-h-[120px] space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-slate-600">
          {projects.length === 0 ? (
            <span className="text-xs text-slate-400">暂无项目</span>
          ) : (
            projects.map(project => (
              <label
                key={project.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <input
                  type="checkbox"
                  checked={(formData.projectIds || []).includes(project.id)}
                  onChange={event => {
                    const projectIds = formData.projectIds || [];
                    onFieldChange(
                      'projectIds',
                      event.target.checked
                        ? [...projectIds, project.id]
                        : projectIds.filter(id => id !== project.id)
                    );
                  }}
                  className="rounded"
                />
                {project.name}
              </label>
            ))
          )}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">排序</label>
        <input
          type="number"
          value={formData.sort ?? 100}
          onChange={e => onFieldChange('sort', Number(e.target.value))}
          className={managementFieldClass}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">默认算法</label>
        <select
          value={formData.algType ?? 2}
          onChange={e => onFieldChange('algType', Number(e.target.value))}
          className={managementFieldClass}
        >
          <option value={1}>贝叶斯</option>
          <option value={2}>DOE 枚举</option>
          <option value={5}>DOE 文件</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">DOE 文件导入 / 粘贴</label>
        <input
          ref={doeFileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onDoeFileSelected(file);
          }}
        />
        {hasDoeFile ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-slate-50 px-3 py-2 dark:bg-slate-700/60">
            <p className="truncate text-xs text-slate-600 dark:text-slate-300">
              已保存 DOE 文件：{formData.doeFileName}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onDownloadDoeFile}
                className="text-xs text-blue-600 underline hover:text-blue-700"
              >
                下载
              </button>
              <button
                type="button"
                onClick={onClearDoeFile}
                className="text-xs text-red-600 underline hover:text-red-700"
              >
                清除
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => doeFileInputRef.current?.click()}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              上传 Excel/CSV
            </button>
            <textarea
              value={doePasteText}
              onChange={e => onDoePasteTextChange(e.target.value)}
              onPaste={onDoeTextareaPaste}
              rows={4}
              className={`${managementFieldClass} font-mono text-xs`}
              placeholder="可直接粘贴 Excel 表格内容：首行为参数 key，从第二行开始为每轮 DOE 数值。"
            />
          </div>
        )}
      </div>
    </div>
  </>
);
