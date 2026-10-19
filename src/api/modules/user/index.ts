import request from '@/api/request';
import type { UserInfo, LoginParams, LoginResponse } from '@/types';

export function getUserInfo() {
  return request.get<UserInfo>('/user/info');
}

export function login(data: LoginParams) {
  return request.post<LoginResponse>('/user/login', data);
}
