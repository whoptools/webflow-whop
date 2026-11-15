import { checkoutAttributes, checkoutUrl, validateConfig, type CheckoutConfig } from './config';

export async function insertCheckout(input: CheckoutConfig): Promise<void> {
  const config = validateConfig(input);
  const parent = await webflow.getSelectedElement() ?? await webflow.getRootElement();
  if (!parent?.children) throw new Error('Select a section, container, or the page body.');
  if (parent.type === 'Link' || (parent.type === 'DOM' && ['a', 'button', 'input', 'select', 'textarea'].includes(await parent.getTag() ?? ''))) throw new Error('Select a section, container, or the page body instead of a link or form control.');
  if (parent.attributes && await parent.getAttributeValue('data-whop-commerce') === '1') throw new Error('Select a container outside the existing checkout.');
  const element = await parent.append(webflow.elementPresets.DOM);
  try {
    await element.setTag(config.mode === 'button' ? 'a' : 'div');
    for (const [key, value] of Object.entries(checkoutAttributes(config))) await element.setAttribute(key, value);
    if (config.mode === 'button') {
      await element.setAttribute('href', checkoutUrl(config));
      await element.setTextContent(config.label);
    } else {
      await element.setAttribute('aria-label', 'Whop checkout');
      const fallback = await element.append(webflow.elementPresets.DOM);
      await fallback.setTag('a');
      await fallback.setAttribute('href', checkoutUrl(config));
      await fallback.setTextContent('Continue to secure checkout');
    }
    const name = config.mode === 'button' ? 'Whop Checkout Button' : 'Whop Checkout Embed';
    let style = await webflow.getStyleByName(name);
    if (!style) {
      style = await webflow.createStyle(name);
      await style.setProperties(config.mode === 'button' ? {
        'display': 'inline-block', 'background-color': '#f4512b', 'color': '#ffffff',
        'padding-top': '14px', 'padding-bottom': '14px', 'padding-left': '24px', 'padding-right': '24px',
        'border-top-left-radius': '8px', 'border-top-right-radius': '8px',
        'border-bottom-left-radius': '8px', 'border-bottom-right-radius': '8px', 'text-decoration': 'none',
      } : { 'width': '100%', 'min-height': '500px', 'max-width': '640px' });
    }
    await element.setStyles([style]);
    await webflow.setSelectedElement(element);
  } catch (error) {
    await element.remove();
    throw error;
  }
}

export async function selectedConfig(): Promise<CheckoutConfig | null> {
  const element = await webflow.getSelectedElement();
  if (!element?.attributes || await element.getAttributeValue('data-whop-commerce') !== '1') return null;
  const read = async (key: string) => {
    const value = await element.getAttributeValue(key);
    if (value !== null && typeof value !== 'string') throw new Error('This checkout uses CMS bindings. Edit its fields in Webflow.');
    return value ?? '';
  };
  return validateConfig({
    plan: await read('data-whop-plan'), environment: await read('data-whop-environment') as CheckoutConfig['environment'],
    mode: await read('data-whop-mode') as CheckoutConfig['mode'], label: await read('data-whop-label'),
    theme: await read('data-whop-theme') as CheckoutConfig['theme'], returnUrl: await read('data-whop-return-url'),
  });
}

export async function updateCheckout(input: CheckoutConfig): Promise<void> {
  const config = validateConfig(input);
  const element = await webflow.getSelectedElement();
  const previous = await selectedConfig();
  if (!element || !previous || !element.attributes) throw new Error('Select a checkout added by this app.');
  if (config.mode !== previous.mode) throw new Error('Add a new element to change between a button and an embed.');
  for (const [key, value] of Object.entries(checkoutAttributes(config))) await element.setAttribute(key, value);
  if (config.mode === 'button' && element.textContent) {
    await element.setAttribute('href', checkoutUrl(config));
    await element.setTextContent(config.label);
  } else if (element.children) {
    for (const child of await element.getChildren()) {
      if (child.type === 'DOM' && await child.getTag() === 'a') await child.setAttribute('href', checkoutUrl(config));
    }
  }
}
