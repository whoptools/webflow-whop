import { loadWhop, type WhopConstructor } from '@whop/elements';
import { validateConfig, type CheckoutConfig } from './config';

declare global { interface Window { WhopElements?: WhopConstructor } }

export async function mountCheckouts(root: ParentNode = document): Promise<void> {
  if (!root.querySelector('[data-whop-commerce="1"][data-whop-mode="embed"]')) return;
  let WhopElements: WhopConstructor;
  try { WhopElements = await loadWhop(); }
  catch { return; } // Keep the hosted-checkout fallback when the payment SDK cannot load.
  root.querySelectorAll<HTMLElement>('[data-whop-commerce="1"][data-whop-mode="embed"]').forEach((node) => {
    if (node.dataset.whopMounted) return;
    try {
      const config = validateConfig({ plan: node.dataset.whopPlan ?? '', environment: node.dataset.whopEnvironment as CheckoutConfig['environment'],
        mode: 'embed', label: node.dataset.whopLabel ?? 'Buy now', returnUrl: node.dataset.whopReturnUrl ?? '',
        theme: node.dataset.whopTheme as CheckoutConfig['theme'] });
      const appearance = config.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : config.theme;
      const whop = WhopElements({ environment: config.environment, appearance: { theme: { appearance } } });
      const handle = whop.checkout.create({ plan: config.plan, ...(config.returnUrl ? { returnUrl: config.returnUrl } : {}), analytics: false });
      const target = document.createElement('div');
      node.append(target);
      handle.create('checkout').mount(target);
      node.dataset.whopMounted = 'true';
    } catch {
      // The hosted-checkout link remains usable if embedding fails.
      node.dataset.whopError = 'true';
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void mountCheckouts(); }, { once: true });
else void mountCheckouts();
