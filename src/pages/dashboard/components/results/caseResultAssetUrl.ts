const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const normalizeSegment = (value: string) => value.replace(/\/+$/, '');
const normalizePath = (value: string) => `/${value.replace(/^\/+/, '')}`;

export const buildCaseResultAssetUrl = (rawPath: string | null | undefined) => {
  const value = String(rawPath || '').trim();
  if (!value) return '';
  if (isAbsoluteUrl(value)) return value;

  const domainUrl = normalizeSegment(import.meta.env.VITE_RESULT_ASSET_DOMAIN_URL || '');
  const proxyPrefix = normalizeSegment(import.meta.env.VITE_RESULT_ASSET_PROXY_PREFIX || '');
  const normalizedPath = normalizePath(value);
  const proxiedPath =
    proxyPrefix && normalizedPath.startsWith(`${proxyPrefix}/`)
      ? normalizedPath
      : `${proxyPrefix}${normalizedPath}`;

  if (!domainUrl) {
    return proxiedPath || normalizedPath;
  }

  return `${domainUrl}${proxiedPath || normalizedPath}`;
};
