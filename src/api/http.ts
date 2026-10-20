import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { authStorage } from '@/utils/authStorage';
import { AppError } from '@/types/error';
import type { ApiResponse } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REFRESH_URL = '/auth/refresh';

const WHITE_LIST = ['/auth/login', '/auth/refresh'];

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

let isRefreshing = false;
let waitingQueue: Array<(token: string) => void> = [];

let onRefreshFail = () => {
  authStorage.clearTokens();
};

export function setRefreshFailHandler(fn: () => void) {
  onRefreshFail = fn;
}

function isInWhiteList(url?: string) {
  if (!url) return false;
  return WHITE_LIST.some((path) => url.includes(path));
}

instance.interceptors.request.use((config) => {
  if (isInWhiteList(config.url)) return config;
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface TokenPairPayload {
  accessToken: string;
  refreshToken: string;
}

async function doRefresh() {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('no refresh token');
  }
  const { data } = await axios.post<ApiResponse<TokenPairPayload>>(`${BASE_URL}${REFRESH_URL}`, {
    refreshToken,
  });
  if (data.code !== 0) {
    throw new Error(data.message);
  }
  authStorage.setAccessToken(data.data.accessToken);
  authStorage.setRefreshToken(data.data.refreshToken);
  return data.data.accessToken;
}

function retryAfterRefresh(config: AxiosRequestConfig) {
  if (!isRefreshing) {
    isRefreshing = true;
    doRefresh()
      .then((token) => {
        waitingQueue.forEach((cb) => cb(token));
        waitingQueue = [];
      })
      .catch(() => onRefreshFail())
      .finally(() => {
        isRefreshing = false;
      });
  }

  return new Promise((resolve) => {
    waitingQueue.push((token) => {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(instance(config));
    });
  });
}

function throwAppError(code: number, serverMessage?: string): never {
  // HTTP 5xx
  if (code >= 500) {
    throw new AppError('服务暂时不可用，请稍后重试', code, 'http', code);
  }
  // HTTP 4xx（401 在上层由 token 刷新处理）
  if (code >= 400) {
    throw new AppError(serverMessage || '请求失败', code, 'http', code);
  }
  // 业务错误码（后端 code !== 0）
  throw new AppError(serverMessage || '系统繁忙，请稍后重试', code, 'business');
}

instance.interceptors.response.use(
  (response) => {
    const apiData = response.data as ApiResponse;
    const config = response.config;
    if (apiData.code === 0) {
      return apiData.data as unknown as AxiosResponse;
    }
    if (apiData.code === 401 && !isInWhiteList(config.url)) {
      return retryAfterRefresh(config) as unknown as Promise<AxiosResponse>;
    }
    throwAppError(apiData.code, apiData.message);
  },
  (error) => {
    const status = error.response?.status;
    const config = error.config;
    if (status === 401 && !isInWhiteList(config?.url)) {
      return retryAfterRefresh(config) as unknown as Promise<AxiosResponse>;
    }
    // 网络层错误（无任何响应）
    if (!error.response) {
      throw new AppError('网络连接失败，请检查网络', 0, 'network');
    }
    throwAppError(status ?? 0, error.response?.data?.message);
  },
);

export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return instance.request(config) as Promise<T>;
}

export function get<T>(url: string, params?: Record<string, unknown>) {
  return request<T>({ url, method: 'GET', params });
}

export function post<T>(url: string, data?: unknown) {
  return request<T>({ url, method: 'POST', data });
}

export function put<T>(url: string, data?: unknown) {
  return request<T>({ url, method: 'PUT', data });
}

export function del<T>(url: string, params?: Record<string, unknown>) {
  return request<T>({ url, method: 'DELETE', params });
}

export default instance;
