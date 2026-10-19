import { get, post } from './http';
import type { LoginParams, LoginResult, TokenPair, UserInfo } from '@/types/api';

export const authApi = {
  login: (params: LoginParams) => post<LoginResult>('/auth/login', params),
  refresh: (refreshToken: string) => post<TokenPair>('/auth/refresh', { refreshToken }),
  logout: () => post<void>('/auth/logout'),
  getUserInfo: () => get<UserInfo>('/user/info'),
};
