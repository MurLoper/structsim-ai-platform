/**
 * 认证心跳检查 Hook
 *
 * 功能：
 * 1. 定时心跳检查（默认5分钟）
 * 2. 路由切换时验证
 * 3. 页面可见性变化时验证
 * 4. 自动刷新即将过期的token
 */
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores';

interface UseAuthHeartbeatOptions {
  /** 心跳间隔（毫秒），默认5分钟 */
  interval?: number;
  /** 是否在路由切换时检查，默认true */
  checkOnRouteChange?: boolean;
  /** 是否在页面可见时检查，默认true */
  checkOnVisibilityChange?: boolean;
  /** 登录过期回调 */
  onSessionExpired?: () => void;
}

export function useAuthHeartbeat(options: UseAuthHeartbeatOptions = {}) {
  const {
    interval = 5 * 60 * 1000, // 5分钟
    checkOnRouteChange = true,
    checkOnVisibilityChange = true,
    onSessionExpired,
  } = options;

  const { isAuthenticated, checkHeartbeat, logout } = useAuthStore();
  const location = useLocation();
  const intervalRef = useRef<number | null>(null);
  const lastCheckRef = useRef<number>(0);

  // 执行心跳检查
  const doHeartbeat = useCallback(async () => {
    if (!isAuthenticated) return;

    // 防止频繁检查（至少间隔30秒）
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) return;
    lastCheckRef.current = now;

    const valid = await checkHeartbeat();
    if (!valid) {
      onSessionExpired?.();
    }
  }, [isAuthenticated, checkHeartbeat, onSessionExpired]);

  // 定时心跳
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(doHeartbeat, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, interval, doHeartbeat]);

  // 路由切换时检查
  useEffect(() => {
    if (checkOnRouteChange && isAuthenticated) {
      doHeartbeat();
    }
  }, [location.pathname, checkOnRouteChange, isAuthenticated, doHeartbeat]);

  // 页面可见性变化时检查
  useEffect(() => {
    if (!checkOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        doHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkOnVisibilityChange, isAuthenticated, doHeartbeat]);

  return {
    checkNow: doHeartbeat,
    logout,
  };
}

export default useAuthHeartbeat;
