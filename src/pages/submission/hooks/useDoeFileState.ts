import { useEffect, useMemo, useRef, useState } from 'react';
import { configApi } from '@/api';
import type { ParamGroup } from '@/types/configGroups';
import type { OptParams } from '../types';
import { AlgorithmType as AlgType } from '../types';
import { parseDoeText } from '../components/paramDrawerData';

interface UseDoeFileStateOptions {
  currentAlgType: AlgType;
  templateSetId: number | null;
  paramGroups: ParamGroup[];
  optParams?: OptParams;
  updateOptParams: (updates: Partial<OptParams>) => void;
}

export const useDoeFileState = ({
  currentAlgType,
  templateSetId,
  paramGroups,
  optParams,
  updateOptParams,
}: UseDoeFileStateOptions) => {
  const [doeFileName, setDoeFileName] = useState<string>('');
  const [doePasteText, setDoePasteText] = useState('');
  const doeFileInputRef = useRef<HTMLInputElement>(null);

  const doeFileDownloadUrl =
    templateSetId && currentAlgType === AlgType.DOE_FILE
      ? configApi.getParamGroupDoeDownloadUrl(templateSetId)
      : '';

  const doeFileDisplayName = useMemo(() => {
    const raw = String(doeFileName || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) {
      const selectedGroup = paramGroups.find(group => group.id === templateSetId);
      if (selectedGroup?.doeFileName) return selectedGroup.doeFileName;
      try {
        const pathname = new URL(raw, window.location.origin).pathname;
        const name = decodeURIComponent(pathname.split('/').pop() || '');
        return name && name !== 'download' ? name : 'DOE文件.csv';
      } catch {
        return 'DOE文件.csv';
      }
    }
    return raw;
  }, [doeFileName, paramGroups, templateSetId]);

  useEffect(() => {
    if (optParams?.doeParamCsvPath) {
      setDoeFileName(String(optParams.doeParamCsvPath));
    }
  }, [optParams?.doeParamCsvPath]);

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;
      const parsed = parseDoeText(text);
      if (!parsed) return;
      setDoeFileName(file.name);
      updateOptParams({
        doeParamHeads: parsed.heads,
        doeParamData: parsed.data,
        doeParamCsvPath: file.name,
      });
    };
    reader.readAsText(file);
  };

  const handleDoeTextareaPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    setTimeout(() => {
      const text = textarea.value;
      setDoePasteText(text);
      const parsed = parseDoeText(text);
      if (!parsed) return;
      setDoeFileName(`pasted_doe_${Date.now()}.csv`);
      updateOptParams({
        doeParamHeads: parsed.heads,
        doeParamData: parsed.data,
        doeParamCsvPath: undefined,
      });
    }, 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseCsvFile(file);
    }
  };

  const clearDoeFile = () => {
    setDoeFileName('');
    setDoePasteText('');
    updateOptParams({ doeParamHeads: [], doeParamData: [], doeParamCsvPath: undefined });
    if (doeFileInputRef.current) {
      doeFileInputRef.current.value = '';
    }
  };

  return {
    clearDoeFile,
    doeFileDisplayName,
    doeFileDownloadUrl,
    doeFileInputRef,
    doePasteText,
    handleDoeTextareaPaste,
    handleFileChange,
    hasDoeFile: Boolean(doeFileDisplayName),
    setDoePasteText,
  };
};
