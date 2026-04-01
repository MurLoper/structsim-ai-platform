import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface SubmissionToolbarProps {
  title: string;
  zoomPercent: number;
  hasConfigError: boolean;
  isConfigLoading: boolean;
  showSimTypeError?: string;
  isSubmitting: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetView: () => void;
  onRetryConfig: () => void;
  onReset: () => void;
  onSubmit: () => void;
  t: (key: string) => string;
}

export const SubmissionToolbar = ({
  title,
  zoomPercent,
  hasConfigError,
  isConfigLoading,
  showSimTypeError,
  isSubmitting,
  onZoomOut,
  onZoomIn,
  onResetView,
  onRetryConfig,
  onReset,
  onSubmit,
  t,
}: SubmissionToolbarProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 eyecare:bg-card border-b border-slate-200 dark:border-slate-700 eyecare:border-border">
      <h1 className="text-xl font-bold text-slate-800 dark:text-white eyecare:text-foreground">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 eyecare:bg-muted rounded-lg p-1">
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-white dark:hover:bg-slate-600 eyecare:hover:bg-card rounded"
            title={t('sub.zoom_out')}
          >
            <MagnifyingGlassMinusIcon className="w-5 h-5" />
          </button>
          <span className="px-2 text-sm font-medium min-w-[50px] text-center">{zoomPercent}%</span>
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-white dark:hover:bg-slate-600 eyecare:hover:bg-card rounded"
            title={t('sub.zoom_in')}
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onResetView}
            className="p-2 hover:bg-white dark:hover:bg-slate-600 eyecare:hover:bg-card rounded"
            title={t('sub.reset_view')}
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>
        </div>
        {hasConfigError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <span>{t('sub.config_load_failed')}</span>
            <Button size="sm" variant="outline" onClick={onRetryConfig} disabled={isConfigLoading}>
              {t('sub.retry')}
            </Button>
          </div>
        )}
        {showSimTypeError && (
          <span className="text-sm text-destructive" role="alert">
            {showSimTypeError}
          </span>
        )}
        <Button variant="outline" onClick={onReset} disabled={isSubmitting}>
          {t('sub.reset')}
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={isSubmitting}>
          {t('sub.submit')}
        </Button>
      </div>
    </div>
  );
};
