import { describe, it, expect, beforeEach } from 'vitest';
import trailReducer, { setTrail, type TrailKey } from '@/store/slices/trailSlice';

describe('trailSlice', () => {
  let initial: ReturnType<typeof trailReducer>;

  beforeEach(() => {
    localStorage.clear();
    initial = trailReducer(undefined, { type: '@@init' });
  });

  it('should default to none', () => {
    expect(initial.active).toBe('none');
  });

  it('should set trail mode and persist to localStorage', () => {
    const next = trailReducer(initial, setTrail('pixel' as TrailKey));
    expect(next.active).toBe('pixel');
    expect(localStorage.getItem('trail')).toBe('pixel');
  });

  it('should switch between all trail modes', () => {
    const modes: TrailKey[] = ['none', 'cursor', 'pixel', 'textRain'];
    for (const mode of modes) {
      const next = trailReducer(initial, setTrail(mode));
      expect(next.active).toBe(mode);
    }
  });
});
