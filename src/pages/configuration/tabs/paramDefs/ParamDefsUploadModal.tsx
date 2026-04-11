import { useRef, useState } from 'react';
import { baseConfigApi } from '@/api';
import { useI18n } from '@/hooks';
import {
  managementModalOverlayClass,
  managementModalPanelClass,
  managementPrimaryButtonDisabledClass,
  managementSecondaryButtonClass,
} from '../../components/managementSurfaceTokens';

interface ParsedParam {
  key: string;
  name: string;
  unit: string;
  minVal: number;
  maxVal: number;
  defaultVal: string;
}

interface ParamDefsUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ParamDefsUploadModal = ({
  onClose,
  onSuccess,
  showToast,
}: ParamDefsUploadModalProps) => {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedParam[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = async (nextFile: File) => {
    const text = await nextFile.text();
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      showToast('error', t('cfg.import.invalid_csv'));
      return;
    }

    const parsed = lines
      .slice(1)
      .map(line => {
        const cols = line.split(',').map(column => column.trim());
        return {
          key: cols[0] || '',
          name: cols[1] || '',
          unit: cols[2] || '',
          minVal: Number(cols[3]) || 0,
          maxVal: Number(cols[4]) || 100,
          defaultVal: cols[5] || '',
        } satisfies ParsedParam;
      })
      .filter(item => item.key);

    setParsedData(parsed);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

    setUploading(true);
    try {
      const items = parsedData.map(item => ({
        key: item.key,
        name: item.name || item.key,
        unit: item.unit,
        minVal: item.minVal,
        maxVal: item.maxVal,
        defaultVal: item.defaultVal,
      }));

      const response = await baseConfigApi.batchCreateParamDefs(items);
      showToast(
        'success',
        t('cfg.import.success', {
          created: response.data?.created?.length || 0,
          skipped: response.data?.skipped?.length || 0,
        })
      );
      onSuccess();
    } catch {
      showToast('error', t('cfg.import.failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={managementModalOverlayClass}>
      <div
        className={`${managementModalPanelClass} mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col`}
      >
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-bold text-foreground">{t('cfg.params.import_title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('cfg.params.import_desc')}</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={event => {
                const nextFile = event.target.files?.[0];
                if (!nextFile) return;
                setFile(nextFile);
                void parseFile(nextFile);
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              {file ? file.name : t('cfg.import.choose_csv')}
            </button>
          </div>

          {parsedData.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left text-foreground">{t('common.key')}</th>
                    <th className="px-3 py-2 text-left text-foreground">{t('common.name')}</th>
                    <th className="px-3 py-2 text-left text-foreground">{t('common.unit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedData.map((item, index) => (
                    <tr key={`${item.key}-${index}`}>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {item.key}
                      </td>
                      <td className="px-3 py-2 text-foreground">{item.name || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.unit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-4">
          <button onClick={onClose} className={managementSecondaryButtonClass}>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleUpload}
            disabled={parsedData.length === 0 || uploading}
            className={managementPrimaryButtonDisabledClass}
          >
            {uploading ? t('cfg.import.importing') : t('cfg.import.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
