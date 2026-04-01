import React from 'react';
import { Trash2 } from 'lucide-react';

type ParamGroupDoeRoundsTableProps = {
  heads: string[];
  data: Array<Record<string, number | string>>;
  getDoeCellValue: (row: Record<string, number | string>, head: string) => string;
  onAddRow: () => void;
  onRemoveRow: (rowIndex: number) => void;
  onCellChange: (rowIndex: number, head: string, value: string) => void;
};

export const ParamGroupDoeRoundsTable: React.FC<ParamGroupDoeRoundsTableProps> = ({
  heads,
  data,
  getDoeCellValue,
  onAddRow,
  onRemoveRow,
  onCellChange,
}) => {
  if (!heads.length) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium">DOE 轮次数据</label>
        <button
          type="button"
          onClick={onAddRow}
          className="rounded border px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          新增轮次
        </button>
      </div>
      <div className="max-h-56 overflow-auto rounded-lg border dark:border-slate-600">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="w-12 px-2 py-1 text-left">#</th>
              {heads.map(head => (
                <th key={head} className="px-2 py-1 text-left font-mono">
                  {head}
                </th>
              ))}
              <th className="w-12 px-2 py-1" />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-600">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-2 py-1 text-slate-500">{rowIndex + 1}</td>
                {heads.map(head => (
                  <td key={`${head}-${rowIndex}`} className="px-2 py-1">
                    <input
                      type="text"
                      value={getDoeCellValue(row, head)}
                      onChange={e => onCellChange(rowIndex, head, e.target.value)}
                      className="w-full rounded border px-1.5 py-1 dark:border-slate-500 dark:bg-slate-600"
                    />
                  </td>
                ))}
                <td className="px-2 py-1">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(rowIndex)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={heads.length + 2} className="px-3 py-3 text-center text-slate-400">
                  暂无 DOE 轮次数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
