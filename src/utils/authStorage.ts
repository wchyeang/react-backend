const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY) ?? '',
  setAccessToken: (value: string) => localStorage.setItem(ACCESS_TOKEN_KEY, value),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY) ?? '',
  setRefreshToken: (value: string) => localStorage.setItem(REFRESH_TOKEN_KEY, value),
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
