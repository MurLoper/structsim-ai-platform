import forge from 'node-forge';
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

const encryptByWebCrypto = async (password: string, publicKeyPem: string) => {
  if (!window.crypto?.subtle) {
    throw new Error('WebCrypto unavailable');
  }

  const importedKey = await window.crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  return window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    importedKey,
    new TextEncoder().encode(password)
  );
};

const encryptByForge = (password: string, publicKeyPem: string) => {
  const importedKey = forge.pki.publicKeyFromPem(publicKeyPem) as forge.pki.rsa.PublicKey;
  return importedKey.encrypt(forge.util.encodeUtf8(password), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: {
      md: forge.md.sha256.create(),
    },
  });
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

  try {
    const encrypted = await encryptByWebCrypto(password, publicKey.publicKeyPem);
    return {
      keyId: publicKey.keyId,
      passwordCiphertext: encodeBase64(encrypted),
    };
  } catch {
    try {
      return {
        keyId: publicKey.keyId,
        passwordCiphertext: window.btoa(encryptByForge(password, publicKey.publicKeyPem)),
      };
    } catch {
      throw new Error('当前浏览器无法完成登录密码加密');
    }
  }
};
