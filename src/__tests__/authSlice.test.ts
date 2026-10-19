import { describe, it, expect } from 'vitest';
import authReducer, { setUserInfo, clearAuth, initialized } from '@/store/slices/authSlice';

describe('authSlice', () => {
  it('should have null userInfo and not initialized by default', () => {
    const state = authReducer(undefined, { type: '@@init' });
    expect(state.userInfo).toBeNull();
    expect(state._initialized).toBe(false);
  });

  it('should set user info', () => {
    const userInfo = { id: 1, username: 'admin', nickname: 'Admin', avatar: '/avatar.png' };
    const state = authReducer(undefined, setUserInfo(userInfo));
    expect(state.userInfo).toEqual(userInfo);
  });

  it('should clear auth', () => {
    const userInfo = { id: 1, username: 'admin' };
    const prev = authReducer(undefined, setUserInfo(userInfo));
    const next = authReducer(prev, clearAuth());
    expect(next.userInfo).toBeNull();
  });

  it('should mark as initialized', () => {
    const state = authReducer(undefined, initialized());
    expect(state._initialized).toBe(true);
  });
});
