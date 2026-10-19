import { describe, it, expect, beforeEach } from 'vitest';
import settingsReducer, {
  setTheme,
  toggleTheme,
  setLocale,
  type ThemeMode,
  type Locale,
} from '@/store/slices/settingsSlice';

describe('settingsSlice', () => {
  let initial: ReturnType<typeof settingsReducer>;

  beforeEach(() => {
    localStorage.clear();
    initial = settingsReducer(undefined, { type: '@@init' });
  });

  it('should have light theme and zh-CN as default', () => {
    expect(initial.theme).toBe('light');
    expect(initial.locale).toBe('zh-CN');
  });

  it('should set theme and persist to localStorage', () => {
    const next = settingsReducer(initial, setTheme('dark' as ThemeMode));
    expect(next.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should toggle theme from light to dark', () => {
    const next = settingsReducer(initial, toggleTheme());
    expect(next.theme).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    const dark = settingsReducer(initial, setTheme('dark' as ThemeMode));
    expect(settingsReducer(dark, toggleTheme()).theme).toBe('light');
  });

  it('should set locale and persist to localStorage', () => {
    const next = settingsReducer(initial, setLocale('en-US' as Locale));
    expect(next.locale).toBe('en-US');
    expect(localStorage.getItem('locale')).toBe('en-US');
  });
});
