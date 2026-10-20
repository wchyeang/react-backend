import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { authStorage } from '@/utils/authStorage';
import { getErrorMessage, getAppErrorMessage } from '@/utils/getErrorMessage';
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

// 刷新失败回调，默认清空 token；auth store 注册后执行登出跳转
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

// 请求拦截器：白名单外自动注入 accessToken
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

// 真正刷新 token 的独立请求，避免复用拦截器再次触发刷新
async function doRefresh() {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('no refresh token');
  }
  const { data } = await axios.post<ApiResponse<TokenPairPayload>>(`${BASE_URL}${REFRESH_URL}`, {
    refreshToken,
  });
  if (data.code !== 0) {
    throw new AppError(
      data.message || getErrorMessage('error.loginExpired'),
      data.code,
      'business',
    );
  }
  authStorage.setAccessToken(data.data.accessToken);
  authStorage.setRefreshToken(data.data.refreshToken);
  return data.data.accessToken;
}

// 单次刷新 + 等待队列重放
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

/** 错误分类并抛出，不弹消息（由全局兜底拦截器统一展示） */
function throwAppError(code: number, serverMessage?: string): never {
  if (code >= 500) {
    throw new AppError(
      getAppErrorMessage(code, serverMessage, 'error.serviceUnavailable'),
      code,
      'http',
      code,
    );
  }
  if (code >= 400) {
    throw new AppError(
      getAppErrorMessage(code, serverMessage, 'error.requestFailed'),
      code,
      'http',
      code,
    );
  }
  throw new AppError(getAppErrorMessage(code, serverMessage), code, 'business');
}

// 响应拦截器 ①：统一业务码处理 + 401 自动刷新
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
      throw new AppError(getErrorMessage('error.network'), 0, 'network');
    }
    throwAppError(status ?? 0, error.response?.data?.message);
  },
);

// 响应拦截器 ②：全局兜底 — 对所有 AppError 自动弹出错误提示
instance.interceptors.response.use(undefined, async (error) => {
  if (error instanceof AppError) {
    // 动态导入避免循环依赖，延迟执行确保 message 已挂载
    const { message } = await import('antd');
    setTimeout(() => message.error(error.message), 100);
  }
  return Promise.reject(error);
});

// 泛型请求封装
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
