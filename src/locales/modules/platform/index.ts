import { platformAnalyticsEn, platformAnalyticsZh } from './analytics';
import { platformContentEn, platformContentZh } from './content';
import { platformPrivacyEn, platformPrivacyZh } from './privacy';

export const platformEn = {
  ...platformAnalyticsEn,
  ...platformPrivacyEn,
  ...platformContentEn,
};

export const platformZh = {
  ...platformAnalyticsZh,
  ...platformPrivacyZh,
  ...platformContentZh,
};
