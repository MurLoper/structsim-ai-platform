import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DoeVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  heads: string[];
  data: Record<string, number | string>[];
  onConfirm: (heads: string[], data: Record<string, number | string>[]) => void;
  t?: (key: string) => string;
}

export const DoeVerifyModal: React.FC<DoeVerifyModalProps> = ({
  isOpen,
  onClose,
  heads: initialHeads,
  data: initialData,
  onConfirm,
  t = (key: string) => key,
}) => {
  const [heads, setHeads] = useState<string[]>(initialHeads);
  const [data, setData] = useState<Record<string, number | string>[]>(initialData);

  // 同步初始数据
  React.useEffect(() => {
    setHeads(initialHeads);
    setData(initialData);
  }, [initialHeads, initialData]);

  // 添加新行
  const addRow = () => {
    const newRow: Record<string, number | string> = {};
    heads.forEach(h => {
      newRow[h] = 0;
    });
    setData([...data, newRow]);
  };

  // 删除行
  const removeRow = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  // 更新单元格
  const updateCell = (rowIndex: number, key: string, value: string) => {
    const newData = [...data];
    const numValue = parseFloat(value);
    newData[rowIndex] = { ...newData[rowIndex], [key]: isNaN(numValue) ? value : numValue };
    setData(newData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative bg-card rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{t('sub.params.doe_verify')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 统计信息 */}
        <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground">
          {t('sub.params.doe_total')}: <span className="font-bold text-primary">{data.length}</span>{' '}
          {t('sub.params.doe_rounds')}
        </div>

        {/* 表格内容 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border border-border rounded-lg overflow-hidden">
            {/* 表头 */}
            <div
              className="grid bg-muted text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: `50px repeat(${heads.length}, 1fr) 40px` }}
            >
              <div className="px-2 py-2 border-r border-border text-center">#</div>
              {heads.map((h, i) => (
                <div key={i} className="px-2 py-2 border-r border-border text-center">
                  {h}
                </div>
              ))}
              <div className="px-2 py-2"></div>
            </div>

            {/* 表格数据 */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {data.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid border-t border-border hover:bg-muted/50"
                  style={{ gridTemplateColumns: `50px repeat(${heads.length}, 1fr) 40px` }}
                >
                  <div className="px-2 py-1 border-r border-border text-center text-xs text-muted-foreground">
                    {rowIdx + 1}
                  </div>
                  {heads.map((h, colIdx) => (
                    <div key={colIdx} className="px-1 py-1 border-r border-border">
                      <input
                        type="text"
                        className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-ring rounded text-center"
                        value={row[h] ?? ''}
                        onChange={e => updateCell(rowIdx, h, e.target.value)}
                      />
                    </div>
                  ))}
                  <div className="px-1 py-1 flex items-center justify-center">
                    <button
                      onClick={() => removeRow(rowIdx)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg"
          >
            <PlusIcon className="w-4 h-4" />
            {t('sub.params.doe_add_row')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
            >
              {t('sub.dismiss')}
            </button>
            <button
              onClick={() => onConfirm(heads, data)}
              className="px-4 py-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg"
            >
              {t('sub.params.doe_confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
