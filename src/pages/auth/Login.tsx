import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui';

const Login: React.FC = () => {
  const { users, login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (id: string) => {
    await login(id);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            StructSim AI Platform
          </h1>
          <p className="text-slate-500 mt-2">Select a user to login</p>
        </div>

        <div className="space-y-3">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleLogin(u.id)}
              className="w-full p-4 text-left border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600 flex items-center gap-4 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center font-bold text-lg">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 dark:text-white group-hover:text-brand-600">
                  {u.name}
                </div>
                <div className="text-xs text-slate-500">{u.email}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {u.permissions.length} permissions
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
