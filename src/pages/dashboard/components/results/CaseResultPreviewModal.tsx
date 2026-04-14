import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui';
import type { TranslationParams } from '@/locales';
import { buildPreviewItems } from './caseResultMatrixMappers';
import type { MatrixAttachment } from './caseResultMatrixTypes';

interface CaseResultPreviewModalProps {
  attachment: MatrixAttachment | null;
  previewIndex: number;
  setPreviewIndex: Dispatch<SetStateAction<number>>;
  onClose: () => void;
  t: (key: string, params?: TranslationParams) => string;
}

export const CaseResultPreviewModal: React.FC<CaseResultPreviewModalProps> = ({
  attachment,
  previewIndex,
  setPreviewIndex,
  onClose,
  t,
}) => {
  const previewItems = useMemo(() => buildPreviewItems(attachment), [attachment]);
  const activePreviewItem = previewItems[previewIndex] || null;

  const goPreview = useCallback(
    (direction: -1 | 1) => {
      if (previewItems.length <= 1) return;
      setPreviewIndex(current => {
        const next = current + direction;
        if (next < 0) return previewItems.length - 1;
        if (next >= previewItems.length) return 0;
        return next;
      });
    },
    [previewItems.length, setPreviewIndex]
  );

  useEffect(() => {
    if (!attachment) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPreview(-1);
      if (event.key === 'ArrowRight') goPreview(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attachment, goPreview]);

  return (
    <Modal
      isOpen={Boolean(attachment)}
      onClose={onClose}
      title={
        attachment
          ? t('res.preview.title', { label: attachment.label, value: attachment.value ?? '-' })
          : undefined
      }
      size="full"
    >
      {activePreviewItem ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20">
            <div className="flex min-h-[70vh] items-center justify-center p-4">
              <img
                src={activePreviewItem.url}
                alt={t('res.preview.alt', { index: previewIndex + 1 })}
                className="max-h-[72vh] max-w-full rounded-xl object-contain"
              />
            </div>

            {previewItems.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg transition hover:bg-card"
                  onClick={() => goPreview(-1)}
                  aria-label={t('res.preview.previous')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg transition hover:bg-card"
                  onClick={() => goPreview(1)}
                  aria-label={t('res.preview.next')}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
              title={activePreviewItem.path}
            >
              {activePreviewItem.path}
            </div>
            <div className="text-xs tabular-nums text-muted-foreground">
              {previewIndex + 1} / {previewItems.length}
            </div>
          </div>

          {previewItems.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previewItems.map((item, index) => (
                <button
                  key={`${item.path}-${index}`}
                  type="button"
                  className={`min-w-[120px] rounded-xl border px-3 py-2 text-left text-xs transition ${
                    index === previewIndex
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => setPreviewIndex(index)}
                  title={item.path}
                >
                  <div className="font-medium">
                    {t(item.type === 'image' ? 'res.preview.image' : 'res.preview.gif')} {index + 1}
                  </div>
                  <div className="mt-1 truncate">{item.path}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          {t('res.preview.empty')}
        </div>
      )}
    </Modal>
  );
};
