/** localStorage 中 accessToken 的 key */
export const ACCESS_TOKEN_KEY = 'accessToken';

/** localStorage 中 refreshToken 的 key */
export const REFRESH_TOKEN_KEY = 'refreshToken';

/** token 是否加密存储 */
export const TOKEN_ENCRYPT = true;

/** 请求基础路径 */
export const BASE_URL = '/api';

/** 普通请求超时时间（毫秒） */
export const REQUEST_TIMEOUT = 10000;

/** 刷新 token 请求超时时间（毫秒） */
export const REFRESH_TIMEOUT = 5000;

/** 刷新 token 后重放请求的滑动窗口大小 */
export const SLIDING_WINDOW_SIZE = 6;

/** 等待刷新的请求队列最大长度 */
export const MAX_QUEUE_SIZE = 50;
