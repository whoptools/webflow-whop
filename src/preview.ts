import { checkoutAttributes, checkoutUrl, validateConfig, type CheckoutConfig } from './config';
import { mountCheckouts } from './storefront';
const container = document.getElementById('preview');
if (container) {
  try {
    const values = Object.fromEntries(new URLSearchParams(window.location.search));
    const config = validateConfig(values as CheckoutConfig);
    document.getElementById('environment')!.textContent = config.environment === 'sandbox' ? 'Sandbox checkout · test payments only' : 'Production checkout · real payments';
    for (const [name, value] of Object.entries(checkoutAttributes({ ...config, mode: 'embed' }))) container.setAttribute(name, value);
    const fallback = document.createElement('a');
    fallback.href = checkoutUrl(config); fallback.textContent = 'Open hosted checkout'; container.append(fallback);
    void mountCheckouts();
  } catch (error) { container.textContent = (error as Error).message; }
}
