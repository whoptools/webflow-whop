export type CheckoutConfig = {
  plan: string;
  environment: 'production' | 'sandbox';
  mode: 'button' | 'embed';
  label: string;
  returnUrl: string;
  theme: 'light' | 'dark' | 'system';
};

export const REFERRAL_URL = 'https://whop.com/start/?code=CAKARK';
export const DEFAULT_CONFIG: CheckoutConfig = {
  plan: '', environment: 'sandbox', mode: 'button', label: 'Buy now', returnUrl: '', theme: 'light',
};

export function parsePlan(input: string, environment: CheckoutConfig['environment']): string {
  const value = input.trim();
  if (/^plan_[a-zA-Z0-9]{5,80}$/.test(value)) return value;
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Enter a plan ID or a Whop checkout link.'); }
  const host = environment === 'sandbox' ? 'sandbox.whop.com' : 'whop.com';
  if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || url.port) {
    throw new Error(`Use a checkout link from ${host}, or change the environment.`);
  }
  const match = url.pathname.match(/^\/checkout\/(plan_[a-zA-Z0-9]{5,80})\/?$/);
  if (!match || url.search || url.hash) throw new Error('Use the direct checkout link without query parameters, or paste its plan ID.');
  return match[1];
}

export function validateConfig(config: CheckoutConfig): CheckoutConfig {
  if (!['production', 'sandbox'].includes(config.environment)) throw new Error('Choose a valid environment.');
  if (!['button', 'embed'].includes(config.mode)) throw new Error('Choose a checkout type.');
  if (!['light', 'dark', 'system'].includes(config.theme)) throw new Error('Choose a checkout theme.');
  const plan = parsePlan(config.plan, config.environment);
  const label = config.label.trim();
  if (!label || label.length > 100) throw new Error('Enter a button label of 1–100 characters.');
  const returnUrl = config.returnUrl.trim();
  if (returnUrl) {
    let url: URL;
    try { url = new URL(returnUrl); } catch { throw new Error('Enter a complete HTTPS return URL.'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Return URL must use HTTPS without credentials.');
  }
  return { ...config, plan, label, returnUrl };
}

export function checkoutUrl(config: CheckoutConfig): string {
  return `https://${config.environment === 'sandbox' ? 'sandbox.' : ''}whop.com/checkout/${config.plan}/`;
}

export function checkoutAttributes(config: CheckoutConfig): Record<string, string> {
  return {
    'data-whop-commerce': '1', 'data-whop-plan': config.plan,
    'data-whop-environment': config.environment, 'data-whop-mode': config.mode,
    'data-whop-theme': config.theme, 'data-whop-label': config.label,
    'data-whop-return-url': config.returnUrl,
  };
}
