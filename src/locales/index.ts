// Locales barrel exports - combine all translation modules
import { commonEn, commonZh } from './modules/common';
import { navEn, navZh } from './modules/navigation';
import { dashboardEn, dashboardZh } from './modules/dashboard';
import { submissionEn, submissionZh } from './modules/submission';
import { configEn, configZh } from './modules/configuration';
import { resultsEn, resultsZh } from './modules/results';

export type Language = 'en' | 'zh';

// Combine all English translations
const en: Record<string, string> = {
  ...commonEn,
  ...navEn,
  ...dashboardEn,
  ...submissionEn,
  ...configEn,
  ...resultsEn,
};

// Combine all Chinese translations
const zh: Record<string, string> = {
  ...commonZh,
  ...navZh,
  ...dashboardZh,
  ...submissionZh,
  ...configZh,
  ...resultsZh,
};

export const RESOURCES: Record<Language, Record<string, string>> = {
  en,
  zh,
};

/**
 * Translation function factory
 */
export const createTranslator = (language: Language) => {
  return (key: string): string => {
    return RESOURCES[language][key] || key;
  };
};

/**
 * Get all available languages
 */
export const getAvailableLanguages = (): { code: Language; name: string }[] => [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];
