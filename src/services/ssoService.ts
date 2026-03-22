/**
 * SSO 服务
 */
import axios from 'axios';

const SSO_TOKEN_KEY = 'sso_access_token';
const SSO_USER_KEY = 'sso_user';

export interface SSOUser {
  id: string;
  domainAccount: string;
  userName?: string;
  realName?: string;
  email: string;
}

export interface SSOLoginResponse {
  access_token: string;
  user: SSOUser;
}

export async function ssoLogin(domainAccount: string, password: string): Promise<SSOLoginResponse> {
  const response = await axios.post('/api/v1/sso/login', {
    domainAccount,
    password,
  });

  const { access_token, user } = response.data;
  localStorage.setItem(SSO_TOKEN_KEY, access_token);
  localStorage.setItem(SSO_USER_KEY, JSON.stringify(user));

  return response.data;
}

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
  } catch {
    clearSSOAuth();
  }

  return null;
}

export async function ssoLogout(): Promise<void> {
  const token = getSSOToken();
  if (token) {
    try {
      await axios.post('/api/v1/sso/logout', null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // ignore
    }
  }
  clearSSOAuth();
}

export function getSSOToken(): string | null {
  return localStorage.getItem(SSO_TOKEN_KEY);
}

export function getSSOUser(): SSOUser | null {
  const userStr = localStorage.getItem(SSO_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

export function clearSSOAuth(): void {
  localStorage.removeItem(SSO_TOKEN_KEY);
  localStorage.removeItem(SSO_USER_KEY);
}

export function isSSO(): boolean {
  return !!getSSOToken();
}
