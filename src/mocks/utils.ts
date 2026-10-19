import type { UserInfo } from '@/types/api';

export const ACCESS_TOKEN_TTL = 10_000;
export const REFRESH_TOKEN_TTL = 60 * 60 * 1000;

interface EncodedPayload {
  exp: number;
  username: string;
  type: 'access' | 'refresh';
}

function base64UrlEncode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(base64)));
}

export function createToken(username: string, type: 'access' | 'refresh', ttl: number): string {
  const payload: EncodedPayload = { exp: Date.now() + ttl, username, type };
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  return `${header}.${base64UrlEncode(JSON.stringify(payload))}.mock-signature`;
}

export function parseToken(token: string | null | undefined): EncodedPayload | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1] ?? '')) as EncodedPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined): boolean {
  const payload = parseToken(token);
  if (!payload) return true;
  return payload.exp <= Date.now();
}

export function resolveUser(username: string): UserInfo {
  return {
    id: 1,
    username,
    nickname: username === 'admin' ? '管理员' : username,
    avatar: '',
  };
}

export function readBearerAuthorization(authorization: string | null): string {
  if (!authorization || !authorization.startsWith('Bearer ')) return '';
  return authorization.slice(7).trim();
}
