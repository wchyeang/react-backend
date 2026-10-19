import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setLocale, type Locale } from '@/store/slices/settingsSlice';

export function useLocale() {
  const dispatch = useAppDispatch();

  const switchLocale = useCallback(
    (locale: Locale) => {
      dispatch(setLocale(locale));
    },
    [dispatch],
  );

  return { switchLocale };
}
