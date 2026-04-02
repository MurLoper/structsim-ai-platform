import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button, Card, Checkbox, useToast } from '@/components/ui';
import {
  useAcceptPrivacyPolicy,
  usePrivacyPolicy,
} from '@/features/platform/queries/usePrivacyPolicy';
import { trackEvent } from '@/features/platform/tracking/tracker';

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
  const { showToast } = useToast();
  const { data: policy, isLoading } = usePrivacyPolicy();
  const acceptMutation = useAcceptPrivacyPolicy();
  const [checked, setChecked] = useState(false);

  const backPath = useMemo(
    () => getBackPath(location.state as PrivacyLocationState | undefined),
    [location.state]
  );

  useEffect(() => {
    trackEvent({
      eventName: 'privacy_view',
      eventType: 'privacy',
      pagePath: '/privacy',
    });
  }, []);

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
      showToast('warning', '请先勾选同意隐私协议');
      return;
    }

    try {
      await acceptMutation.mutateAsync(policy.version);
      trackEvent({
        eventName: 'privacy_accept',
        eventType: 'privacy',
        pagePath: '/privacy',
        metadata: { version: policy.version },
      });
      showToast('success', '隐私协议已确认');
      navigate(backPath, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '隐私协议确认失败';
      showToast('error', message);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">隐私协议</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            阅读并确认当前版本的隐私协议后，才可继续进入系统。
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4" />
          返回
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
                {policy?.title || '隐私协议'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                当前版本：{policy?.version || '--'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
            {policy?.summary || '正在加载隐私协议摘要...'}
          </div>

          <div className="min-h-[360px] whitespace-pre-wrap rounded-2xl border border-border bg-background px-5 py-4 text-sm leading-7 text-foreground">
            {isLoading ? '隐私协议内容加载中...' : policy?.content || '暂无隐私协议内容'}
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <Checkbox
              checked={checked}
              onChange={event => setChecked(event.target.checked)}
              label="我已阅读并同意当前版本的隐私协议"
            />
            {policy?.accepted && (
              <p className="text-sm text-muted-foreground">你已同意当前版本的隐私协议。</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleAccept}
                disabled={acceptMutation.isPending || (policy?.required && !checked)}
              >
                {acceptMutation.isPending ? '提交中...' : '同意并进入系统'}
              </Button>
              <Button variant="outline" onClick={() => navigate(backPath)}>
                稍后查看
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
