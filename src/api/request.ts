import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { TokenRefresher } from '@/api/token-refresher';
import { BASE_URL, REQUEST_TIMEOUT } from '@/constants';

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

const tokenRefresher = new TokenRefresher();

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenRefresher.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      return tokenRefresher.handle401(originalRequest, (config) => request(config));
    }

    return Promise.reject(error);
  },
);

export default request;

export const clearAuth = () => tokenRefresher.clearAuth();
