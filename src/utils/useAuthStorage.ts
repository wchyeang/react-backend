import { useLocalStorageState } from 'ahooks';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function useAuthStorage() {
  const [accessToken, setAccessToken] = useLocalStorageState<string>(ACCESS_TOKEN_KEY, {
    defaultValue: '',
  });
  const [refreshToken, setRefreshToken] = useLocalStorageState<string>(REFRESH_TOKEN_KEY, {
    defaultValue: '',
  });

  return {
    accessToken: accessToken ?? '',
    refreshToken: refreshToken ?? '',
    setAccessToken,
    setRefreshToken,
    clearTokens: () => {
      setAccessToken('');
      setRefreshToken('');
    },
  };
}
