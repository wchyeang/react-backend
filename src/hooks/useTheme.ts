import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme, setTheme, type ThemeMode } from '@/store/slices/settingsSlice';

export function useTheme() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.settings.theme);

  const toggle = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  const switchTheme = useCallback(
    (theme: ThemeMode) => {
      dispatch(setTheme(theme));
    },
    [dispatch],
  );

  return {
    mode,
    isDark: mode === 'dark',
    toggle,
    switchTheme,
  };
}
