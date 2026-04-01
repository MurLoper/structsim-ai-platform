import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores';

const SsoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginBySsoUid } = useAuthStore();
  const [message, setMessage] = useState('正在完成 SSO 登录...');

  useEffect(() => {
    const uid = (searchParams.get('uid') || '').trim();
    if (!uid) {
      setMessage('SSO 回调缺少 uid 参数，请重新登录。');
      return;
    }

    loginBySsoUid(uid)
      .then(() => navigate('/', { replace: true }))
      .catch(error => {
        setMessage(error instanceof Error ? error.message : 'SSO 登录失败。');
      });
  }, [loginBySsoUid, navigate, searchParams]);

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
