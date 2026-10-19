import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLocale, type Locale } from '@/store/slices/settingsSlice';

export function useLocaleToggle() {
  const locale = useAppSelector((state) => state.settings.locale);
  const dispatch = useAppDispatch();

  const handleChange = useCallback(
    (next: Locale) => {
      dispatch(setLocale(next));
    },
    [dispatch],
  );

  return { locale, handleChange };
}
