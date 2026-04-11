import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button, Card, Checkbox, useToast } from '@/components/ui';
import {
  useAcceptPrivacyPolicy,
  usePrivacyPolicy,
} from '@/features/platform/queries/usePrivacyPolicy';
import {
  trackPrivacyAccept,
  trackPrivacyView,
} from '@/features/platform/tracking/domains/platformTracking';
import { useI18n } from '@/hooks';

type PrivacyLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

const getBackPath = (state?: PrivacyLocationState) => {
  if (!state?.from?.pathname) {
    return '/';
  }
  return `${state.from.pathname}${state.from.search || ''}`;
};

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { showToast } = useToast();
  const { data: policy, isLoading } = usePrivacyPolicy();
  const acceptMutation = useAcceptPrivacyPolicy();
  const [checked, setChecked] = useState(false);

  const backPath = useMemo(
    () => getBackPath(location.state as PrivacyLocationState | undefined),
    [location.state]
  );

  useEffect(() => {
    trackPrivacyView(policy?.version);
  }, [policy?.version]);

  useEffect(() => {
    if (policy?.accepted) {
      setChecked(true);
    }
  }, [policy?.accepted]);

  const handleAccept = async () => {
    if (!policy) {
      return;
    }

    if (policy.required && !checked) {
      showToast('warning', t('platform.privacy.accept_required'));
      return;
    }

    try {
      await acceptMutation.mutateAsync(policy.version);
      trackPrivacyAccept(policy.version);
      showToast('success', t('platform.privacy.accept_success'));
      navigate(backPath, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('platform.privacy.accept_failed');
      showToast('error', message);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{t('platform.privacy.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('platform.privacy.subtitle')}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>

      <Card className="rounded-3xl" padding="none">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {policy?.title || t('platform.privacy.title')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('platform.privacy.current_version', { version: policy?.version || '--' })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
            {policy?.summary || t('platform.privacy.summary_loading')}
          </div>

          <div className="min-h-[360px] whitespace-pre-wrap rounded-2xl border border-border bg-background px-5 py-4 text-sm leading-7 text-foreground">
            {isLoading
              ? t('platform.privacy.content_loading')
              : policy?.content || t('platform.privacy.content_empty')}
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <Checkbox
              checked={checked}
              onChange={event => setChecked(event.target.checked)}
              label={t('platform.privacy.accept_label')}
            />
            {policy?.accepted && (
              <p className="text-sm text-muted-foreground">{t('platform.privacy.accepted_tip')}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleAccept}
                disabled={acceptMutation.isPending || (policy?.required && !checked)}
              >
                {acceptMutation.isPending
                  ? t('platform.privacy.accepting')
                  : t('platform.privacy.accept_submit')}
              </Button>
              <Button variant="outline" onClick={() => navigate(backPath)}>
                {t('platform.privacy.view_later')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
