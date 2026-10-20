import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/types/api';
import { ErrorCode } from '@/types/error';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  createToken,
  isTokenExpired,
  parseToken,
  resolveUser,
  readBearerAuthorization,
} from './utils';

const BASE = '/api';

const loginHandler = http.post(`${BASE}/auth/login`, async ({ request }) => {
  const { username, password } = (await request.json()) as { username?: string; password?: string };

  if (username !== 'admin' || password !== 'admin') {
    const body: ApiResponse = {
      code: ErrorCode.AUTH_WRONG_CREDENTIALS,
      message: '用户名或密码错误',
      data: null,
    };
    return HttpResponse.json(body);
  }

  const info = resolveUser(username);
  const body: ApiResponse = {
    code: 0,
    message: 'ok',
    data: {
      accessToken: createToken(username, 'access', ACCESS_TOKEN_TTL),
      refreshToken: createToken(username, 'refresh', REFRESH_TOKEN_TTL),
      userInfo: info,
    },
  };
  return HttpResponse.json(body);
});

const refreshHandler = http.post(`${BASE}/auth/refresh`, async ({ request }) => {
  const { refreshToken } = (await request.json()) as { refreshToken?: string };
  const payload = parseToken(refreshToken);

  if (!payload || payload.type !== 'refresh' || isTokenExpired(refreshToken)) {
    const body: ApiResponse = {
      code: ErrorCode.AUTH_REFRESH_EXPIRED,
      message: '登录已失效，请重新登录',
      data: null,
    };
    return HttpResponse.json(body);
  }

  const username = payload.username;
  const body: ApiResponse = {
    code: 0,
    message: 'ok',
    data: {
      accessToken: createToken(username, 'access', ACCESS_TOKEN_TTL),
      refreshToken: createToken(username, 'refresh', REFRESH_TOKEN_TTL),
    },
  };
  return HttpResponse.json(body);
});

const logoutHandler = http.post(`${BASE}/auth/logout`, () => {
  const body: ApiResponse = { code: 0, message: 'ok', data: null };
  return HttpResponse.json(body);
});

const userInfoHandler = http.get(`${BASE}/user/info`, ({ request }) => {
  const token = readBearerAuthorization(request.headers.get('Authorization'));
  const payload = parseToken(token);

  if (!payload || payload.type !== 'access' || isTokenExpired(token)) {
    const body: ApiResponse = { code: 401, message: '登录已过期', data: null };
    return HttpResponse.json(body);
  }

  const body: ApiResponse = { code: 0, message: 'ok', data: resolveUser(payload.username) };
  return HttpResponse.json(body);
});

export const handlers = [loginHandler, refreshHandler, logoutHandler, userInfoHandler];
