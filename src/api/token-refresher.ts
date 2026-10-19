import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import router from '@/router';
import { localStorageAction } from '@/hooks/useLocalStorage';
import { StorageMethod } from '@/enums';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_ENCRYPT,
  BASE_URL,
  REFRESH_TIMEOUT,
  SLIDING_WINDOW_SIZE,
  MAX_QUEUE_SIZE,
} from '@/constants';

interface QueueEntry {
  onResolved: (token: string) => Promise<unknown>;
  onRejected: (error: unknown) => void;
}

type RetryFn = (config: InternalAxiosRequestConfig) => Promise<unknown>;

const QUEUE_FULL_RETRY_DELAY = 200;
const QUEUE_FULL_MAX_RETRIES = 3;

function runWithSlidingWindow(
  tasks: Array<() => Promise<unknown>>,
  windowSize = SLIDING_WINDOW_SIZE,
): Promise<void> {
  const safeSize = Math.max(1, windowSize);
  let running = 0;
  let nextIndex = 0;

  return new Promise<void>((resolve) => {
    const next = () => {
      while (running < safeSize && nextIndex < tasks.length) {
        const idx = nextIndex++;
        running++;
        tasks[idx]()
          .catch(() => {})
          .finally(() => {
            running--;
            next();
          });
      }
      if (running === 0 && nextIndex >= tasks.length) {
        resolve();
      }
    };
    next();
  });
}

export class TokenRefresher {
  private static readonly NO_TOKEN = Symbol('no_token');

  private cachedAccessToken: string | null | typeof TokenRefresher.NO_TOKEN =
    TokenRefresher.NO_TOKEN;
  private isRefreshing = false;
  private requestsQueue: QueueEntry[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === ACCESS_TOKEN_KEY) {
          this.cachedAccessToken = TokenRefresher.NO_TOKEN;
        }
      });
    }
  }

  getToken(): string | null {
    if (this.cachedAccessToken !== TokenRefresher.NO_TOKEN) {
      return this.cachedAccessToken as string | null;
    }
    const token = localStorageAction<string>(StorageMethod.Get, ACCESS_TOKEN_KEY, TOKEN_ENCRYPT);
    this.cachedAccessToken = token;
    return token;
  }

  async handle401(
    originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
    retryFn: RetryFn,
  ): Promise<unknown> {
    if (this.isRefreshing) {
      return this.enqueueOrRetry(originalRequest, retryFn);
    }
    return this.executeRefresh(originalRequest, retryFn);
  }

  clearAuth(): void {
    this.cachedAccessToken = TokenRefresher.NO_TOKEN;
    localStorageAction(StorageMethod.Remove, [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    router.navigate('/login');
  }

  private async enqueueOrRetry(
    originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
    retryFn: RetryFn,
  ): Promise<unknown> {
    let retries = 0;
    while (this.requestsQueue.length >= MAX_QUEUE_SIZE && retries < QUEUE_FULL_MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, QUEUE_FULL_RETRY_DELAY));
      retries++;
      if (!this.isRefreshing) {
        originalRequest._retry = true;
        return retryFn(originalRequest);
      }
    }

    if (this.requestsQueue.length >= MAX_QUEUE_SIZE) {
      console.debug('[refresh] 队列已满，拒绝新请求');
      return Promise.reject(new Error('等待刷新的请求过多，请稍后重试'));
    }

    originalRequest._retry = true;
    console.debug(`[refresh] 请求入队，当前队列: ${this.requestsQueue.length + 1}`);
    return new Promise((resolve, reject) => {
      this.requestsQueue.push({
        onResolved: (newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return retryFn(originalRequest).then(resolve, reject);
        },
        onRejected: (err: unknown) => reject(err),
      });
    });
  }

  private async executeRefresh(
    originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
    retryFn: RetryFn,
  ): Promise<unknown> {
    this.isRefreshing = true;
    originalRequest._retry = true;

    try {
      const newToken = await this.refreshTokenRequest();
      await this.drainQueue(newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return retryFn(originalRequest);
    } catch (refreshError) {
      console.debug('[refresh] 刷新失败，清空队列并跳转登录');
      this.rejectAll(refreshError);
      this.clearAuth();
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  private async refreshTokenRequest(): Promise<string> {
    const refreshToken = localStorageAction<string>(
      StorageMethod.Get,
      REFRESH_TOKEN_KEY,
      TOKEN_ENCRYPT,
    );

    if (!refreshToken) {
      throw new Error('no refresh token');
    }

    console.debug('[refresh] 开始刷新 token');

    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: REFRESH_TIMEOUT },
    );

    if (!data?.accessToken) {
      console.debug('[refresh] 刷新响应缺少 accessToken');
      throw new Error('refresh response missing accessToken');
    }

    this.cachedAccessToken = data.accessToken;
    localStorageAction(StorageMethod.Set, ACCESS_TOKEN_KEY, data.accessToken, TOKEN_ENCRYPT);
    if (data.refreshToken) {
      localStorageAction(StorageMethod.Set, REFRESH_TOKEN_KEY, data.refreshToken, TOKEN_ENCRYPT);
    }

    console.debug('[refresh] 刷新完成');
    return data.accessToken;
  }

  private async drainQueue(token: string): Promise<void> {
    while (this.requestsQueue.length > 0) {
      const batch = this.requestsQueue.slice();
      this.requestsQueue = [];
      console.debug(`[refresh] 重放 ${batch.length} 个排队请求`);
      await runWithSlidingWindow(
        batch.map(
          ({ onResolved }) =>
            () =>
              onResolved(token),
        ),
      );
    }
  }

  private rejectAll(error: unknown): void {
    this.requestsQueue.forEach(({ onRejected }) => onRejected(error));
    this.requestsQueue = [];
  }
}
