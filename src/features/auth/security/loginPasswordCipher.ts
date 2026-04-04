import { authApi } from '@/api';

const LOGIN_PUBLIC_KEY_CACHE_KEY = 'auth_login_public_key';

type CachedLoginPublicKey = {
  keyId: string;
  algorithm: string;
  publicKeyPem: string;
  cachedAt: number;
};

const pemToArrayBuffer = (pem: string) => {
  const content = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

const encodeBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const readCachedPublicKey = (): CachedLoginPublicKey | null => {
  try {
    const raw = sessionStorage.getItem(LOGIN_PUBLIC_KEY_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedLoginPublicKey;
    if (!parsed?.keyId || !parsed?.publicKeyPem) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearCachedLoginPublicKey = () => {
  sessionStorage.removeItem(LOGIN_PUBLIC_KEY_CACHE_KEY);
};

export const getLoginPublicKey = async (forceRefresh = false) => {
  const cached = !forceRefresh ? readCachedPublicKey() : null;
  if (cached) {
    return cached;
  }

  if (forceRefresh) {
    clearCachedLoginPublicKey();
  }

  const response = await authApi.getLoginPublicKey();
  const payload = response.data;
  const next: CachedLoginPublicKey = {
    keyId: payload.keyId,
    algorithm: payload.algorithm,
    publicKeyPem: payload.publicKeyPem,
    cachedAt: Date.now(),
  };
  sessionStorage.setItem(LOGIN_PUBLIC_KEY_CACHE_KEY, JSON.stringify(next));
  return next;
};

export const encryptPasswordForLogin = async (password: string, forceRefresh = false) => {
  const publicKey = await getLoginPublicKey(forceRefresh);
  if (!window.crypto?.subtle) {
    throw new Error('当前浏览器不支持 WebCrypto，无法完成登录加密');
  }

  const importedKey = await window.crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKey.publicKeyPem),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    importedKey,
    new TextEncoder().encode(password)
  );

  return {
    keyId: publicKey.keyId,
    passwordCiphertext: encodeBase64(encrypted),
  };
};
