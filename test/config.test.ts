import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, checkoutAttributes, checkoutUrl, parsePlan, validateConfig } from '../src/config';

void test('accepts a plan and its exact environment-specific checkout URL', () => {
  assert.equal(parsePlan(' plan_abc123 ', 'sandbox'), 'plan_abc123');
  assert.equal(parsePlan('https://sandbox.whop.com/checkout/plan_abc123/', 'sandbox'), 'plan_abc123');
  assert.equal(parsePlan('https://whop.com/checkout/plan_abc123', 'production'), 'plan_abc123');
});
void test('rejects lookalike hosts, credentials, scripts, and wrong environments', () => {
  for (const input of ['https://whop.com.evil.test/checkout/plan_abc123', 'https://evil@whop.com/checkout/plan_abc123', 'javascript:alert(1)', 'https://sandbox.whop.com/checkout/plan_abc123', 'https://whop.com/checkout/plan_abc123/?a=other', 'plan_abc123"><script>']) {
    assert.throws(() => parsePlan(input, 'production'));
  }
});
void test('rejects invalid return destinations and unsupported options', () => {
  const valid = { ...DEFAULT_CONFIG, plan: 'plan_abc123' };
  for (const returnUrl of ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com']) assert.throws(() => validateConfig({ ...valid, returnUrl }));
  assert.throws(() => validateConfig({ ...valid, environment: 'wrong' as 'sandbox' }));
  assert.throws(() => validateConfig({ ...valid, label: ' ' }));
});
void test('does not attach developer referral attribution to merchant checkouts', () => {
  const config = validateConfig({ ...DEFAULT_CONFIG, plan: 'plan_abc123', environment: 'production' });
  assert.equal(checkoutUrl(config), 'https://whop.com/checkout/plan_abc123/');
  assert.doesNotMatch(JSON.stringify(checkoutAttributes(config)), /CAKARK|affiliate/);
});
