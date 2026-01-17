import React from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { OriginFile } from '../types';
import type { Project } from '@/types';
import type { FoldType } from '@/api/config';

interface ProjectDrawerContentProps {
  projects: Project[];
  selectedProjectId: number | null;
  onProjectChange: (id: number | null) => void;
  originFile: OriginFile;
  onOriginFileChange: (file: OriginFile) => void;
  foldTypes: FoldType[];
  foldTypeId: number;
  onFoldTypeChange: (id: number) => void;
  remark: string;
  onRemarkChange: (remark: string) => void;
  t: (key: string) => string;
}

export const ProjectDrawerContent: React.FC<ProjectDrawerContentProps> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  originFile,
  onOriginFileChange,
  foldTypes,
  foldTypeId,
  onFoldTypeChange,
  remark,
  onRemarkChange,
  t,
}) => (
  <div className="space-y-6">
    {/* 项目选择 */}
    <div>
      <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
        {t('sub.sel_project')}
      </label>
      <select
        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
        value={selectedProjectId || ''}
        onChange={e => onProjectChange(Number(e.target.value) || null)}
      >
        <option value="">-- 请选择项目 --</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.code})
          </option>
        ))}
      </select>
    </div>

    {/* 源文件 */}
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
            onClick={() => onOriginFileChange({ ...originFile, type: opt.v })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              originFile.type === opt.v
                ? 'bg-white dark:bg-slate-600 shadow text-brand-600'
                : 'text-slate-500'
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>
      {originFile.type === 3 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
          <ArrowUpTrayIcon className="w-10 h-10 mx-auto mb-2 text-slate-400" />
          <p className="text-slate-500 text-sm">拖拽文件到此处或点击上传</p>
        </div>
      ) : (
        <input
          type="text"
          className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
          placeholder={originFile.type === 1 ? '输入文件路径...' : '输入文件ID...'}
          value={originFile.path}
          onChange={e => onOriginFileChange({ ...originFile, path: e.target.value })}
        />
      )}
    </div>

    {/* 折叠类型 */}
    <div>
      <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
        折叠类型 (姿态)
      </label>
      <select
        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
        value={foldTypeId}
        onChange={e => onFoldTypeChange(Number(e.target.value))}
      >
        {foldTypes.map(ft => (
          <option key={ft.id} value={ft.id}>
            {ft.name} ({ft.angle}°)
          </option>
        ))}
      </select>
    </div>

    {/* 备注 */}
    <div>
      <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
        {t('sub.remarks')}
      </label>
      <textarea
        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 h-24 resize-none"
        placeholder="输入备注信息..."
        value={remark}
        onChange={e => onRemarkChange(e.target.value)}
      />
    </div>
  </div>
);
