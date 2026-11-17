import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTheme, readTheme, resolveTheme, saveTheme } from '../src/ui-theme';

void test('automatic appearance follows the host before the device; explicit choice wins', () => {
  assert.equal(resolveTheme('system', false, 'dark'), 'dark');
  assert.equal(resolveTheme('system', true, 'light'), 'light');
  assert.equal(resolveTheme('light', true, 'dark'), 'light');
  assert.equal(resolveTheme('dark', false, 'light'), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

void test('unknown stored choices and unavailable storage safely fall back to system', () => {
  for (const value of [null, '', 'auto', '<script>', {}]) assert.equal(parseTheme(value), 'system');
  assert.equal(parseTheme('light'), 'light');
  assert.equal(parseTheme('dark'), 'dark');
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage denied'); } });
  try {
    assert.equal(readTheme(), 'system');
    assert.doesNotThrow(() => saveTheme('dark'));
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
