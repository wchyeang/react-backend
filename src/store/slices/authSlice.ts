import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authStorage } from '@/utils/authStorage';
import { authApi } from '@/api/auth';
import { setRefreshFailHandler } from '@/api/http';
import type { LoginParams, UserInfo } from '@/types/api';
import type { AppDispatch } from '@/store';

interface AuthState {
  userInfo: UserInfo | null;
  _initialized: boolean;
}

const initialState: AuthState = {
  userInfo: null,
  _initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserInfo(state, action: PayloadAction<UserInfo | null>) {
      state.userInfo = action.payload;
    },
    clearAuth(state) {
      state.userInfo = null;
    },
    initialized(state) {
      state._initialized = true;
    },
  },
});

export const { setUserInfo, clearAuth, initialized } = authSlice.actions;

export function loginThunk(params: LoginParams) {
  return async (dispatch: AppDispatch) => {
    const result = await authApi.login(params);
    authStorage.setAccessToken(result.accessToken);
    authStorage.setRefreshToken(result.refreshToken);
    dispatch(setUserInfo(result.userInfo));
  };
}

export function logoutThunk() {
  return async (dispatch: AppDispatch) => {
    authApi.logout().catch(() => {});
    authStorage.clearTokens();
    dispatch(clearAuth());
  };
}

export function initAuthThunk() {
  return async (dispatch: AppDispatch) => {
    if (authStorage.getAccessToken()) {
      try {
        const info = await authApi.getUserInfo();
        dispatch(setUserInfo(info));
      } catch {
        authStorage.clearTokens();
        dispatch(clearAuth());
      }
    }
    dispatch(initialized());
  };
}

setRefreshFailHandler(() => {
  authStorage.clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
});

export default authSlice.reducer;
