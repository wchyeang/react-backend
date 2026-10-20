/** 业务错误码枚举（与后端约定） */
export const ErrorCode = {
  SUCCESS: 0,

  // ── 认证 401xx ──
  AUTH_WRONG_CREDENTIALS: 40101,
  AUTH_ACCOUNT_LOCKED: 40102,
  AUTH_TOKEN_EXPIRED: 40103,
  AUTH_REFRESH_EXPIRED: 40104,

  // ── 授权 403xx ──
  FORBIDDEN: 40301,

  // ── 校验 422xx ──
  VALIDATION_ERROR: 42201,

  // ── 频率限制 429xx ──
  RATE_LIMITED: 42901,

  // ── 服务端 500xx ──
  SERVER_ERROR: 50001,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 错误来源分类 */
export type ErrorKind = 'network' | 'http' | 'business' | 'unknown';

/**
 * 企业级应用错误
 * 统一承载网络层 / HTTP 层 / 业务层的错误信息
 */
export class AppError extends Error {
  /** 错误码 */
  readonly code: number;
  /** 错误来源 */
  readonly kind: ErrorKind;
  /** HTTP 状态码（仅 kind === 'http' 时有值） */
  readonly httpStatus?: number;

  constructor(message: string, code: number, kind: ErrorKind = 'unknown', httpStatus?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.kind = kind;
    this.httpStatus = httpStatus;
  }

  /** 是否属于认证类错误（登录相关） */
  get isAuthError(): boolean {
    return (
      this.code === ErrorCode.AUTH_WRONG_CREDENTIALS ||
      this.code === ErrorCode.AUTH_ACCOUNT_LOCKED ||
      this.code === ErrorCode.AUTH_TOKEN_EXPIRED ||
      this.code === ErrorCode.AUTH_REFRESH_EXPIRED
    );
  }

  /** 是否属于系统级错误（网络断开 / HTTP 5xx） */
  get isSystemError(): boolean {
    return this.kind === 'network' || (this.kind === 'http' && this.code >= 500);
  }
}
