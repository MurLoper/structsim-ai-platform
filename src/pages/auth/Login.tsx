import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const { login, fetchLoginMode, loginMode } = useAuthStore();
  const navigate = useNavigate();

  const [domainAccount, setDomainAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modeLoading, setModeLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchLoginMode()
      .catch(() => {
        if (!mounted) return;
        setError('登录模式获取失败，请稍后重试');
      })
      .finally(() => {
        if (mounted) setModeLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchLoginMode]);

  useEffect(() => {
    if (!modeLoading && loginMode.ssoEnabled && loginMode.ssoRedirectUrl) {
      window.location.href = loginMode.ssoRedirectUrl;
    }
  }, [modeLoading, loginMode.ssoEnabled, loginMode.ssoRedirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!domainAccount.trim()) {
      setError('请输入域账号');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      await login(domainAccount.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            力学多场景仿真&优化平台
          </h1>
          <p className="text-slate-500 mt-2">登录您的账号</p>
        </div>

        {modeLoading ? (
          <div className="py-8 text-center text-slate-500">登录模式加载中...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                域账号
              </label>
              <input
                type="text"
                value={domainAccount}
                onChange={e => setDomainAccount(e.target.value)}
                placeholder="例如 z00012345 或 lwx0045644"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
