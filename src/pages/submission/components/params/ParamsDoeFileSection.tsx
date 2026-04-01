import React from 'react';
import { DocumentArrowDownIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { FormItem } from '@/components/ui';
import { AlgorithmType as AlgType } from '../../types';
import { getDoeCellValue } from '../paramDrawerData';
import { drawerUploadButtonClass } from '../paramDrawerClassNames';

interface ParamsDoeFileSectionProps {
  currentAlgType: AlgType;
  doeFileInputRef: React.RefObject<HTMLInputElement | null>;
  doeFileDisplayName: string;
  doeFileDownloadUrl: string;
  doePasteText: string;
  doePasteTextareaClass: string;
  hasDoeFile: boolean;
  doeParamHeads: string[];
  doeParamData: Array<Record<string, number | string>>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onPasteTextChange: (value: string) => void;
  onTextareaPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  t: (key: string) => string;
}

export const ParamsDoeFileSection: React.FC<ParamsDoeFileSectionProps> = ({
  currentAlgType,
  doeFileInputRef,
  doeFileDisplayName,
  doeFileDownloadUrl,
  doePasteText,
  doePasteTextareaClass,
  hasDoeFile,
  doeParamHeads,
  doeParamData,
  onFileChange,
  onClearFile,
  onPasteTextChange,
  onTextareaPaste,
  t,
}) => {
  if (currentAlgType !== AlgType.DOE_FILE) {
    return null;
  }

  return (
    <FormItem label={t('sub.params.doe_file_upload')}>
      <input
        ref={doeFileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onFileChange}
      />

      {hasDoeFile ? (
        <div className="border rounded-lg px-3 py-2 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-primary break-all">{doeFileDisplayName}</p>
            <div className="flex items-center gap-2 shrink-0">
              {doeFileDownloadUrl ? (
                <a
                  href={doeFileDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 underline"
                >
                  <DocumentArrowDownIcon className="w-3 h-3" />
                  下载
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClearFile}
                className="text-xs text-destructive hover:text-destructive/80 underline"
              >
                清除
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => doeFileInputRef.current?.click()}
            className={drawerUploadButtonClass}
          >
            <DocumentArrowUpIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('sub.params.doe_file_hint')}</p>
          </button>

          <div className="mt-2">
            <textarea
              value={doePasteText}
              onChange={event => onPasteTextChange(event.target.value)}
              onPaste={onTextareaPaste}
              rows={4}
              className={doePasteTextareaClass}
              placeholder="支持直接粘贴 DOE 表格：首行为 key，第二行起为每轮数据，粘贴后自动解析。"
            />
          </div>
        </>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t('sub.params.doe_total')}: {doeParamData.length} {t('sub.params.doe_rounds')}
        </span>
      </div>

      {doeParamData.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-[300px] overflow-auto custom-scrollbar">
              <div
                className="grid gap-px bg-border"
                style={{
                  gridTemplateColumns: `50px repeat(${doeParamHeads.length}, minmax(80px, 1fr))`,
                }}
              >
                <div className="bg-muted px-2 py-2 text-xs font-medium text-center">#</div>
                {doeParamHeads.map(head => (
                  <div key={head} className="bg-muted px-2 py-2 text-xs font-medium text-center">
                    {head}
                  </div>
                ))}

                {doeParamData.map((row, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    <div className="bg-card px-2 py-1 text-xs text-center text-muted-foreground">
                      {rowIdx + 1}
                    </div>
                    {doeParamHeads.map(head => (
                      <div key={head} className="bg-card px-2 py-1 text-xs text-center">
                        {getDoeCellValue(row, head)}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </FormItem>
  );
};
