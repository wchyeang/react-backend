import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { messages } from '@/locales';

export function useLocaleProvider() {
  const locale = useAppSelector((state) => state.settings.locale);

  const localeMessages = useMemo(() => messages[locale] ?? messages['zh-CN'], [locale]);

  return {
    locale,
    localeMessages,
  };
}
