import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/hooks';
import { useAuthStore } from '@/stores';

const SsoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { loginBySsoUid } = useAuthStore();
  const [message, setMessage] = useState(() => t('auth.sso.loading'));

  useEffect(() => {
    const uid = (searchParams.get('uid') || '').trim();
    if (!uid) {
      setMessage(t('auth.sso.missing_uid'));
      return;
    }

    loginBySsoUid(uid)
      .then(() => navigate('/', { replace: true }))
      .catch(error => {
        setMessage(error instanceof Error ? error.message : t('auth.sso.failed'));
      });
  }, [loginBySsoUid, navigate, searchParams, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-foreground">{message}</p>
      </div>
    </div>
  );
};

export default SsoCallback;
