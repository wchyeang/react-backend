import { describe, it, expect, beforeEach } from 'vitest';
import { authStorage } from '@/utils/authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve access token', () => {
    authStorage.setAccessToken('test-access');
    expect(authStorage.getAccessToken()).toBe('test-access');
  });

  it('should return empty string when no access token', () => {
    expect(authStorage.getAccessToken()).toBe('');
  });

  it('should store and retrieve refresh token', () => {
    authStorage.setRefreshToken('test-refresh');
    expect(authStorage.getRefreshToken()).toBe('test-refresh');
  });

  it('should clear both tokens', () => {
    authStorage.setAccessToken('access');
    authStorage.setRefreshToken('refresh');
    authStorage.clearTokens();
    expect(authStorage.getAccessToken()).toBe('');
    expect(authStorage.getRefreshToken()).toBe('');
  });
});
