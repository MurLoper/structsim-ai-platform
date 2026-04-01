import React, { useEffect, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';

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
        if (mounted) {
          setError('登录模式获取失败，请稍后重试。');
        }
      })
      .finally(() => {
        if (mounted) {
          setModeLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [fetchLoginMode]);

  useEffect(() => {
    if (!modeLoading && loginMode.ssoEnabled && loginMode.ssoRedirectUrl) {
      window.location.href = loginMode.ssoRedirectUrl;
    }
  }, [loginMode.ssoEnabled, loginMode.ssoRedirectUrl, modeLoading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!domainAccount.trim()) {
      setError('请输入域账号。');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码。');
      return;
    }

    setLoading(true);
    try {
      await login(domainAccount.trim(), password);
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : '登录失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-3xl font-bold text-white">
            S
          </div>
          <h1 className="text-2xl font-bold text-foreground">结构仿真 AI 平台</h1>
          <p className="mt-2 text-muted-foreground">登录您的账号以继续访问工作台。</p>
        </div>

        {modeLoading ? (
          <div className="py-8 text-center text-muted-foreground">正在加载登录模式...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMode.testAccountBypassEnabled && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                当前环境已启用测试账号直登。仅对白名单中的现有账号生效，登录时会跳过密码校验。
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">域账号</label>
              <input
                type="text"
                value={domainAccount}
                onChange={event => setDomainAccount(event.target.value)}
                placeholder="例如 z00012345 或 lwx0045644"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-ring focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="请输入密码"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-foreground focus:border-ring focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(previous => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
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
