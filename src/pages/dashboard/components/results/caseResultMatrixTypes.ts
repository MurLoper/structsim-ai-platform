import type { ResultOutputAttachment } from '@/api/results';

export type MatrixValue = string | number | null;
export type MatrixAttachment = ResultOutputAttachment & { label: string; value: MatrixValue };
export type CaseResultViewMode = 'matrix' | 'analysis';
export type PreviewItem = { type: 'image' | 'gif'; path: string; url: string };
export type ResultsTranslator = (
  key: string,
  params?: Record<string, string | number | boolean | null | undefined>
) => string;

export interface MatrixRow {
  __rowKey: string;
  roundIndex: number;
  __attachments: Record<string, MatrixAttachment>;
  [key: string]: MatrixValue | Record<string, MatrixAttachment>;
}
