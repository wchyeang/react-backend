import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// 必须在所有 import 之前定义 mock，vitest 会自动 hoist
// ============================================================

const mockRouterNavigate = vi.fn();
const mockLocalStorageGet = vi.fn();
const mockLocalStorageSet = vi.fn();
const mockLocalStorageRemove = vi.fn();
const mockLocalStorageClear = vi.fn();

// mock adapter：模拟 axios 的 HTTP 适配器，每个测试可以控制它
const mockAdapter = vi.fn();

// 保存模块级的 axios.post（用于 refresh 请求）
const mockAxiosPost = vi.fn();

vi.mock('@/router', () => ({
  default: { navigate: mockRouterNavigate },
}));

vi.mock('@/enums', () => ({
  StorageMethod: {
    Get: 'GET',
    Set: 'SET',
    Remove: 'REMOVE',
    Clear: 'CLEAR',
  },
}));

vi.mock('@/hooks/useLocalStorage', () => ({
  localStorageAction: (method: string, ...args: unknown[]) => {
    switch (method) {
      case 'GET':
        return mockLocalStorageGet(...args);
      case 'SET':
        return mockLocalStorageSet(...args);
      case 'REMOVE':
        return mockLocalStorageRemove(...args);
      case 'CLEAR':
        return mockLocalStorageClear(...args);
    }
  },
}));

vi.mock('@/constants', () => ({
  ACCESS_TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  TOKEN_ENCRYPT: true,
  BASE_URL: '/api',
  REQUEST_TIMEOUT: 10000,
  REFRESH_TIMEOUT: 5000,
  SLIDING_WINDOW_SIZE: 3,
  MAX_QUEUE_SIZE: 5,
}));

// ============================================================
// 模拟 axios 模块
// 关键修复：每次 create() 返回全新实例，避免拦截器累积
// 并支持函数调用语法 request(config)
// ============================================================
vi.mock('axios', () => {
  function createMockInstance() {
    const requestFns: Array<(config: Record<string, unknown>) => Record<string, unknown>> = [];
    const responseFns: Array<(res: Record<string, unknown>) => unknown> = [];
    const responseErrFns: Array<(err: Record<string, unknown>) => unknown> = [];

    async function runRequest(config: Record<string, unknown>) {
      let c: Record<string, unknown> = { headers: {}, ...config };
      for (const fn of requestFns) {
        c = await Promise.resolve(fn(c));
      }
      try {
        let res = await mockAdapter(c);
        for (const fn of responseFns) {
          res = (await Promise.resolve(fn(res))) as Record<string, unknown>;
        }
        return res;
      } catch (err) {
        let e = err as Record<string, unknown>;
        let recovered = false;
        for (const fn of responseErrFns) {
          try {
            e = (await Promise.resolve(fn(e))) as Record<string, unknown>;
            recovered = true;
          } catch (newErr) {
            e = newErr as Record<string, unknown>;
            recovered = false;
          }
        }
        if (recovered) {
          return e;
        }
        throw e;
      }
    }

    //   关键修复：实例本身可作为函数调用 request(config)
    const instance = function (config: Record<string, unknown>) {
      return runRequest(config);
    } as Record<string, unknown> & ((config: Record<string, unknown>) => Promise<unknown>);

    instance.interceptors = {
      request: {
        use: (f: (config: Record<string, unknown>) => Record<string, unknown>) => {
          requestFns.push(f);
          return 0;
        },
        eject: () => {},
      },
      response: {
        use: (
          f: (res: Record<string, unknown>) => unknown,
          r: (err: Record<string, unknown>) => unknown,
        ) => {
          responseFns.push(f);
          if (r) responseErrFns.push(r);
          return 0;
        },
        eject: () => {},
      },
    };

    instance.get = (url: string, config?: Record<string, unknown>) =>
      runRequest({ ...config, url, method: 'get' });
    instance.post = (url: string, data?: unknown, config?: Record<string, unknown>) =>
      runRequest({ ...config, url, data, method: 'post' });
    instance.put = (url: string, data?: unknown, config?: Record<string, unknown>) =>
      runRequest({ ...config, url, data, method: 'put' });
    instance.delete = (url: string, config?: Record<string, unknown>) =>
      runRequest({ ...config, url, method: 'delete' });

    return instance;
  }

  return {
    default: {
      //   关键修复：每次 create() 返回全新实例
      create: () => createMockInstance(),
      post: mockAxiosPost,
      Cancel: class Cancel extends Error {
        __CANCEL__: boolean;
        constructor(message?: string) {
          super(message ?? 'canceled');
          this.name = 'Cancel';
          this.__CANCEL__ = true;
        }
      },
      isCancel: (value: unknown) =>
        value instanceof Error && (value as { __CANCEL__?: boolean }).__CANCEL__ === true,
      AxiosHeaders: class {
        private headers: Record<string, string> = {};
        set(key: string, value: string) {
          this.headers[key.toLowerCase()] = value;
        }
        get(key: string) {
          return this.headers[key.toLowerCase()];
        }
      },
    },
  };
});

// ============================================================
// 动态导入：每次重新加载模块获得干净的 isRefreshing / requestsQueue
// 配合 create() 返回新实例，state 完全隔离
// ============================================================
async function importRequest() {
  vi.resetModules();
  const mod = await import('@/api/request');
  return mod.default;
}

// ============================================================
// 辅助函数
// ============================================================

function makeAxiosResponse(data: unknown, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  };
}

function makeAxiosError(status: number, config: Record<string, unknown>, data?: unknown) {
  return {
    response: { status, data: data ?? null },
    config,
    message: `Request failed with status code ${status}`,
    isAxiosError: true,
  };
}

// ============================================================
// 公共 beforeEach：每个测试前重置所有 mock 状态
// ============================================================
beforeEach(() => {
  vi.clearAllMocks();
  // 默认有 token 和 refreshToken
  mockLocalStorageGet.mockImplementation((key: string) => {
    if (key === 'accessToken') return 'test-token';
    if (key === 'refreshToken') return 'test-refresh-token';
    return null;
  });
  // 默认 mockAdapter 返回成功
  mockAdapter.mockResolvedValue(makeAxiosResponse({ ok: true }));
});

// ============================================================
// 1. 请求拦截器测试
// ============================================================
describe('request interceptor', () => {
  it('应将 token 添加到 Authorization 头', async () => {
    mockLocalStorageGet.mockReturnValue('my-access-token');
    const req = await importRequest();

    await req.get('/test');

    const adapterCall = mockAdapter.mock.calls[0][0] as Record<string, unknown>;
    const headers = adapterCall.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer my-access-token');
  });

  it('无 token 时不应添加 Authorization 头', async () => {
    mockLocalStorageGet.mockReturnValue(null);
    const req = await importRequest();

    await req.get('/test');

    const adapterCall = mockAdapter.mock.calls[0][0] as Record<string, unknown>;
    const headers = adapterCall.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

// ============================================================
// 2. 响应拦截器 - 成功响应解包
// ============================================================
describe('response interceptor - success', () => {
  it('应返回 response.data 而非完整响应', async () => {
    mockAdapter.mockResolvedValue(makeAxiosResponse({ id: 1, name: 'test' }));
    const req = await importRequest();

    const result = await req.get('/test');
    expect(result).toEqual({ id: 1, name: 'test' });
  });
});

// ============================================================
// 3. 非 401 错误透传
// ============================================================
describe('response interceptor - non-401 errors', () => {
  it('500 错误应透传', async () => {
    const req = await importRequest();
    mockAdapter.mockRejectedValue(makeAxiosError(500, { url: '/test', headers: {} }));

    await expect(req.get('/test')).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it('网络错误（无 response）应透传', async () => {
    const req = await importRequest();
    mockAdapter.mockRejectedValue({
      message: 'Network Error',
      config: { url: '/test', headers: {} },
    });

    await expect(req.get('/test')).rejects.toMatchObject({
      message: 'Network Error',
    });
  });

  it('超时错误应透传', async () => {
    const req = await importRequest();
    mockAdapter.mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout of 10000ms exceeded',
      config: { url: '/test', headers: {} },
    });

    await expect(req.get('/test')).rejects.toMatchObject({
      code: 'ECONNABORTED',
    });
  });
});

// ============================================================
// 4. 401 处理 - 刷新成功
// ============================================================
describe('401 handling - refresh success', () => {
  beforeEach(() => {
    mockLocalStorageGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'old-access-token';
      if (key === 'refreshToken') return 'my-refresh-token';
      return null;
    });
  });

  it('单个 401 应触发刷新，成功后重试原请求', async () => {
    const req = await importRequest();

    mockAdapter
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test', headers: {} }))
      .mockResolvedValueOnce(makeAxiosResponse({ recovered: true }));

    mockAxiosPost.mockResolvedValueOnce({
      data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
    });

    const result = await req.get('/test');
    expect(result).toEqual({ recovered: true });

    expect(mockAxiosPost).toHaveBeenCalledWith(
      '/api/auth/refresh',
      { refreshToken: 'my-refresh-token' },
      { timeout: 5000 },
    );

    expect(mockLocalStorageSet).toHaveBeenCalledWith('accessToken', 'new-access-token', true);
    expect(mockLocalStorageSet).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', true);

    expect(mockAdapter).toHaveBeenCalledTimes(2);
  });

  it('刷新响应中无 refreshToken 字段时不应崩溃', async () => {
    const req = await importRequest();

    mockAdapter
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test', headers: {} }))
      .mockResolvedValueOnce(makeAxiosResponse({ ok: true }));

    mockAxiosPost.mockResolvedValueOnce({
      data: { accessToken: 'new-access-token' },
    });

    const result = await req.get('/test');
    expect(result).toEqual({ ok: true });

    expect(mockLocalStorageSet).toHaveBeenCalledWith('accessToken', 'new-access-token', true);
    const refreshCalls = mockLocalStorageSet.mock.calls.filter(
      (c: unknown[]) => c[0] === 'refreshToken',
    );
    expect(refreshCalls.length).toBe(0);
  });
});

// ============================================================
// 5. _retry 标志防止无限循环
// ============================================================
describe('_retry flag', () => {
  beforeEach(() => {
    mockLocalStorageGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'access-token';
      if (key === 'refreshToken') return 'refresh-token';
      return null;
    });
  });

  it('_retry=true 时不应再次触发刷新', async () => {
    const req = await importRequest();

    mockAdapter.mockRejectedValue(makeAxiosError(401, { url: '/test', headers: {}, _retry: true }));

    await expect(req.get('/test')).rejects.toBeDefined();

    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('BUG: 排队请求重放后再次 401 应被 _retry 拦截', async () => {
    const req = await importRequest();

    mockAdapter
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/a', headers: {} }))
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/b', headers: {} }))
      .mockResolvedValueOnce(makeAxiosResponse({ b: 'ok' }))
      .mockResolvedValueOnce(makeAxiosResponse({ a: 'ok' }));

    mockAxiosPost.mockResolvedValueOnce({
      data: { accessToken: 'new-token', refreshToken: 'new-refresh' },
    });

    const [a, b] = await Promise.all([req.get('/test/a'), req.get('/test/b')]);

    expect(a).toEqual({ a: 'ok' });
    expect(b).toEqual({ b: 'ok' });

    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
  });
});

// ============================================================
// 6. 刷新期间并发请求排队
// ============================================================
describe('concurrent 401 queueing', () => {
  beforeEach(() => {
    mockLocalStorageGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'old-token';
      if (key === 'refreshToken') return 'refresh-token';
      return null;
    });
  });

  it('刷新期间多个 401 请求应排队，刷新成功后一起重放', async () => {
    const req = await importRequest();

    mockAdapter
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/1', headers: {} }))
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/2', headers: {} }))
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/3', headers: {} }))
      .mockResolvedValueOnce(makeAxiosResponse({ ok: '2' }))
      .mockResolvedValueOnce(makeAxiosResponse({ ok: '3' }))
      .mockResolvedValueOnce(makeAxiosResponse({ ok: '1' }));

    mockAxiosPost.mockResolvedValueOnce({
      data: { accessToken: 'new-token', refreshToken: 'new-refresh' },
    });

    const results = await Promise.all([req.get('/test/1'), req.get('/test/2'), req.get('/test/3')]);

    expect(results).toEqual([{ ok: '1' }, { ok: '2' }, { ok: '3' }]);
    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockAdapter).toHaveBeenCalledTimes(6);
  });

  it('排队超过 MAX_QUEUE_SIZE 应拒绝新请求', async () => {
    const req = await importRequest();

    mockAdapter.mockRejectedValue(makeAxiosError(401, { url: '/test', headers: {} }));

    mockAxiosPost.mockReturnValue(new Promise(() => {}));

    req.get('/test/0').catch(() => {});
    req.get('/test/1').catch(() => {});
    req.get('/test/2').catch(() => {});
    req.get('/test/3').catch(() => {});
    req.get('/test/4').catch(() => {});
    req.get('/test/5').catch(() => {});

    await new Promise((resolve) => setTimeout(resolve, 0));

    await expect(req.get('/test/6')).rejects.toThrow('等待刷新的请求过多');
    await expect(req.get('/test/7')).rejects.toThrow('等待刷新的请求过多');
  });
});

// ============================================================
// 7. 刷新失败
// ============================================================
describe('refresh failure', () => {
  beforeEach(() => {
    mockLocalStorageGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'old-token';
      if (key === 'refreshToken') return 'refresh-token';
      return null;
    });
  });

  it('刷新失败应清除认证、跳转登录、拒绝所有排队请求', async () => {
    const req = await importRequest();

    mockAdapter
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/1', headers: {} }))
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/2', headers: {} }))
      .mockRejectedValueOnce(makeAxiosError(401, { url: '/test/3', headers: {} }));

    mockAxiosPost.mockRejectedValueOnce(new Error('refresh token expired'));

    const results = await Promise.allSettled([
      req.get('/test/1'),
      req.get('/test/2'),
      req.get('/test/3'),
    ]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(mockLocalStorageRemove).toHaveBeenCalledWith(['accessToken', 'refreshToken']);
    expect(mockRouterNavigate).toHaveBeenCalledWith('/login');
  });

  it('无 refreshToken 时应直接清除认证', async () => {
    mockLocalStorageGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'old-token';
      if (key === 'refreshToken') return null;
      return null;
    });

    const req = await importRequest();
    mockAdapter.mockRejectedValue(makeAxiosError(401, { url: '/test', headers: {} }));

    await expect(req.get('/test')).rejects.toBeDefined();

    expect(mockLocalStorageRemove).toHaveBeenCalledWith(['accessToken', 'refreshToken']);
    expect(mockRouterNavigate).toHaveBeenCalledWith('/login');
  });

  it('BUG: 刷新响应缺少 accessToken 时 clearAuthAndRedirect 应只调用一次', async () => {
    mockLocalStorageGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'old-token';
      if (key === 'refreshToken') return 'refresh-token';
      return null;
    });

    const req = await importRequest();
    mockAdapter.mockRejectedValue(makeAxiosError(401, { url: '/test', headers: {} }));

    mockAxiosPost.mockResolvedValueOnce({
      data: { accessToken: '' },
    });

    await expect(req.get('/test')).rejects.toBeDefined();

    const removeCalls = mockLocalStorageRemove.mock.calls.filter(
      (c: unknown[]) => JSON.stringify(c[0]) === JSON.stringify(['accessToken', 'refreshToken']),
    );
    expect(removeCalls.length).toBe(1);
  });
});

// ============================================================
// 8. cancel 请求透传
// ============================================================
describe('cancel request', () => {
  it('axios cancel 错误应直接透传', async () => {
    const req = await importRequest();
    const { default: axios } = await import('axios');

    const cancelError = new axios.Cancel('user canceled');
    mockAdapter.mockRejectedValue(cancelError);

    await expect(req.get('/test')).rejects.toBeInstanceOf(Error);
  });
});
