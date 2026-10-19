import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { authStorage } from '@/utils/authStorage';
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

function handleBusinessError(code: number, error: Error) {
  if (typeof window !== 'undefined') {
    void message.error(error.message || '请求失败');
  }
  void code;
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
    handleBusinessError(apiData.code, new Error(apiData.message));
    return Promise.reject(new Error(apiData.message));
  },
  (error) => {
    const status = error.response?.status;
    const config = error.config;
    if (status === 401 && !isInWhiteList(config?.url)) {
      return retryAfterRefresh(config) as unknown as Promise<AxiosResponse>;
    }
    handleBusinessError(status, error);
    return Promise.reject(error);
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
