import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/settingsSlice';
import { useIntl } from 'react-intl';

export function useThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.settings.theme);
  const intl = useIntl();

  const handleToggle = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  return {
    mode,
    isDark: mode === 'dark',
    label:
      mode === 'light'
        ? intl.formatMessage({ id: 'header.theme.dark' })
        : intl.formatMessage({ id: 'header.theme.light' }),
    handleToggle,
  };
}
