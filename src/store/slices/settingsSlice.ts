import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';
export type Locale = 'zh-CN' | 'en-US';

interface SettingsState {
  theme: ThemeMode;
  locale: Locale;
}

const initialState: SettingsState = {
  theme: (localStorage.getItem('theme') as ThemeMode) || 'light',
  locale: (localStorage.getItem('locale') as Locale) || 'zh-CN',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleTheme(state) {
      const next = state.theme === 'light' ? 'dark' : 'light';
      state.theme = next;
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    },
    setLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload;
      localStorage.setItem('locale', action.payload);
    },
  },
});

export const { setTheme, toggleTheme, setLocale } = settingsSlice.actions;
export default settingsSlice.reducer;
