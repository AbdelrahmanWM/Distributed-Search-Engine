import { describe, it, expect, beforeEach } from 'vitest';
import { loadJSON, saveJSON } from './storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips values', () => {
    saveJSON('k', { a: 1 });
    expect(loadJSON('k', { a: 0 })).toEqual({ a: 1 });
  });

  it('returns fallback when key missing', () => {
    expect(loadJSON('missing', 42)).toBe(42);
  });

  it('returns fallback on corrupt JSON', () => {
    localStorage.setItem('bad', '{nope');
    expect(loadJSON('bad', 'fb')).toBe('fb');
  });
});
