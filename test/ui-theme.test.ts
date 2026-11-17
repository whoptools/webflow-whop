import test from 'node:test';
import assert from 'node:assert/strict';
import { watchSystemTheme } from '../src/ui-theme';

void test('system theme initializes, follows changes, ignores legacy overrides and unsubscribes', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Theme storage must never be read'); } });
  const listeners = new Set<() => void>();
  const media = { matches: true, addEventListener: (_: string, fn: () => void) => listeners.add(fn), removeEventListener: (_: string, fn: () => void) => listeners.delete(fn) };
  const seen: string[] = [];
  try {
    const stop = watchSystemTheme(value => seen.push(value), media as unknown as MediaQueryList);
    assert.deepEqual(seen, ['dark']);
    media.matches = false;
    listeners.forEach(fn => fn());
    assert.deepEqual(seen, ['dark', 'light']);
    media.matches = true;
    listeners.forEach(fn => fn());
    assert.deepEqual(seen, ['dark', 'light', 'dark']);
    stop();
    assert.equal(listeners.size, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
