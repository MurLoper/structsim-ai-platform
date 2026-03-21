import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores';

const SsoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginBySsoUid } = useAuthStore();
  const [message, setMessage] = useState('正在完成SSO登录...');

  useEffect(() => {
    const uid = (searchParams.get('uid') || '').trim();
    if (!uid) {
      setMessage('SSO回调缺少uid参数，请重新登录');
      return;
    }

    loginBySsoUid(uid)
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch(err => {
        const text = err instanceof Error ? err.message : 'SSO登录失败';
        setMessage(text);
      });
  }, [searchParams, loginBySsoUid, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-700 dark:text-slate-300">{message}</p>
      </div>
    </div>
  );
};

export default SsoCallback;
