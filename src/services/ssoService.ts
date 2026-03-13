/**
 * SSO服务 - 单点登录
 */
import axios from 'axios';

const SSO_TOKEN_KEY = 'sso_access_token';
const SSO_USER_KEY = 'sso_user';

export interface SSOUser {
  id: number;
  username: string;
  email: string;
  role: string | null;
}

export interface SSOLoginResponse {
  access_token: string;
  user: SSOUser;
}

/**
 * SSO登录
 */
export async function ssoLogin(username: string, password: string): Promise<SSOLoginResponse> {
  const response = await axios.post('/api/v1/sso/login', {
    username,
    password,
  });

  const { access_token, user } = response.data;

  // 保存token和用户信息
  localStorage.setItem(SSO_TOKEN_KEY, access_token);
  localStorage.setItem(SSO_USER_KEY, JSON.stringify(user));

  return response.data;
}

/**
 * 验证SSO token
 */
export async function verifySSOToken(): Promise<SSOUser | null> {
  const token = getSSOToken();
  if (!token) return null;

  try {
    const response = await axios.get('/api/v1/sso/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.valid) {
      localStorage.setItem(SSO_USER_KEY, JSON.stringify(response.data.user));
      return response.data.user;
    }
  } catch (error) {
    clearSSOAuth();
  }

  return null;
}

/**
 * SSO登出
 */
export async function ssoLogout(): Promise<void> {
  const token = getSSOToken();
  if (token) {
    try {
      await axios.post('/api/v1/sso/logout', null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // 忽略错误
    }
  }
  clearSSOAuth();
}

/**
 * 获取SSO token
 */
export function getSSOToken(): string | null {
  return localStorage.getItem(SSO_TOKEN_KEY);
}

/**
 * 获取SSO用户信息
 */
export function getSSOUser(): SSOUser | null {
  const userStr = localStorage.getItem(SSO_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * 清除SSO认证信息
 */
export function clearSSOAuth(): void {
  localStorage.removeItem(SSO_TOKEN_KEY);
  localStorage.removeItem(SSO_USER_KEY);
}

/**
 * 检查是否已SSO登录
 */
export function isSSO(): boolean {
  return !!getSSOToken();
}
