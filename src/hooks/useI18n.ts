import { useCallback } from 'react';
import { RESOURCES, formatMessage, type TranslationParams } from '@/locales';
import { useUIStore } from '@/stores';

export const useI18n = () => {
  const { language } = useUIStore();

  const t = useCallback(
    (key: string, params?: TranslationParams) =>
      formatMessage(RESOURCES[language][key] || key, params),
    [language]
  );

  return { language, t };
};
