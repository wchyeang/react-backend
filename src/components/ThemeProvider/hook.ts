import { useCallback } from 'react';
import { theme as antdTheme } from 'antd';
import { useAppSelector } from '@/store/hooks';

export function useThemeProvider() {
  const mode = useAppSelector((state) => state.settings.theme);

  const algorithm = useCallback(() => {
    return mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;
  }, [mode]);

  return {
    mode,
    algorithm,
    isDark: mode === 'dark',
  };
}
