import { commonEn, commonZh } from './modules/common';
import { navEn, navZh } from './modules/navigation';
import { dashboardEn, dashboardZh } from './modules/dashboard';
import { ordersEn, ordersZh } from './modules/orders';
import { submissionEn, submissionZh } from './modules/submission';
import { configEn, configZh } from './modules/configuration';
import { resultsEn, resultsZh } from './modules/results';
import { platformEn, platformZh } from './modules/platform';
import { accessEn, accessZh } from './modules/access';
import { authEn, authZh } from './modules/auth';

export type Language = 'en' | 'zh';
export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

const en: Record<string, string> = {
  ...commonEn,
  ...navEn,
  ...dashboardEn,
  ...ordersEn,
  ...submissionEn,
  ...configEn,
  ...resultsEn,
  ...platformEn,
  ...accessEn,
  ...authEn,
};

const zh: Record<string, string> = {
  ...commonZh,
  ...navZh,
  ...dashboardZh,
  ...ordersZh,
  ...submissionZh,
  ...configZh,
  ...resultsZh,
  ...platformZh,
  ...accessZh,
  ...authZh,
};

export const RESOURCES: Record<Language, Record<string, string>> = {
  en,
  zh,
};

export const formatMessage = (template: string, params?: TranslationParams): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? '' : String(value);
  });
};

export const createTranslator = (language: Language) => {
  return (key: string, params?: TranslationParams): string => {
    return formatMessage(RESOURCES[language][key] || key, params);
  };
};

export const getAvailableLanguages = (): { code: Language; name: string }[] => [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];
