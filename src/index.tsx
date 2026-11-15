import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_CONFIG, REFERRAL_URL, checkoutUrl, validateConfig, type CheckoutConfig } from './config';
import { insertCheckout, selectedConfig, updateCheckout } from './designer';
declare const __API_ORIGIN__: string;

function App() {
  const inDesigner = typeof webflow !== 'undefined';
  useEffect(() => { if (inDesigner) void webflow.setExtensionSize({ width: 480, height: 740 }).catch(() => {}); }, [inDesigner]);
  const [config, setConfig] = useState<CheckoutConfig>(DEFAULT_CONFIG);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [installed, setInstalled] = useState(false);
  const set = <K extends keyof CheckoutConfig>(key: K, value: CheckoutConfig[K]) => setConfig(old => ({ ...old, [key]: value }));
  const run = async (action: () => Promise<string>) => {
    setBusy(true); setMessage(''); setError(false);
    try { setMessage(await action()); } catch (reason) { setError(true); setMessage(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };
  const api = async (action: 'status' | 'install' | 'disconnect') => {
    if (!inDesigner) throw new Error('Open this app in the Webflow Designer to connect a site.');
    const { siteId } = await webflow.getSiteInfo();
    const idToken = await webflow.getIdToken();
    const response = await fetch(`${__API_ORIGIN__}/api/sites/${siteId}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(`The connection service returned an unexpected response (${response.status}). Reopen the app and try again.`);
    const result = await response.json() as { error?: string; connected?: boolean; installed?: boolean; message?: string };
    if (!response.ok) throw new Error(result.error ?? 'Could not connect to Webflow.');
    setConnected(!!result.connected); setInstalled(!!result.installed);
    return result.message ?? (result.installed ? 'Embedded checkout is ready. Publish your site when you’re ready.' : 'Site connected. Enable embedded checkout to add payment forms.');
  };
  const preview = () => {
    try {
      const value = validateConfig(config);
      if (value.mode === 'button') window.open(checkoutUrl(value), '_blank', 'noopener,noreferrer');
      else {
        const url = new URL(`${__API_ORIGIN__}/preview.html`);
        for (const [key, val] of Object.entries(value)) url.searchParams.set(key, val);
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
      }
    } catch (reason) { setError(true); setMessage((reason as Error).message); }
  };
  return <main>
    <header><div className="brand-mark">w</div><div><h1>Whop Checkout</h1><p>Payments, right where you design.</p></div><span className="version">0.1</span></header>
    {!inDesigner && <div className="preview-notice">Local preview · Open inside Webflow to add elements to your site.</div>}
    <section className="card">
      <div className="section-heading"><span className="step">1</span><h2>Choose your checkout</h2></div>
      <div className="segments" aria-label="Checkout type">
        <button aria-pressed={config.mode === 'button'} onClick={() => set('mode', 'button')}>↗ Checkout button</button>
        <button aria-pressed={config.mode === 'embed'} onClick={() => set('mode', 'embed')}>▤ Embedded checkout</button>
      </div>
      <label htmlFor="environment">Environment</label><select id="environment" value={config.environment} onChange={event => set('environment', event.target.value as CheckoutConfig['environment'])}><option value="sandbox">Sandbox · test payments</option><option value="production">Production · real payments</option></select>
      <label htmlFor="plan">Plan ID or checkout link</label><input id="plan" value={config.plan} onChange={event => set('plan', event.target.value)} placeholder="plan_… or https://whop.com/checkout/…" autoComplete="off" spellCheck={false}/>
      <p className="help">Copy it from Checkout links in your <a href={config.environment === 'sandbox' ? 'https://sandbox.whop.com/dashboard' : 'https://whop.com/dashboard'} target="_blank" rel="noreferrer">Whop dashboard ↗</a>.</p>
      <label htmlFor="label">Button label</label><input id="label" maxLength={100} value={config.label} onChange={event => set('label', event.target.value)}/>
      {config.mode === 'embed' && <><label htmlFor="theme">Checkout appearance</label><select id="theme" value={config.theme} onChange={event => set('theme', event.target.value as CheckoutConfig['theme'])}><option value="light">Light</option><option value="dark">Dark</option><option value="system">Match visitor’s device</option></select><label htmlFor="return">Return URL <span className="muted">optional</span></label><input id="return" type="url" value={config.returnUrl} onChange={event => set('returnUrl', event.target.value)} placeholder="https://your-site.com/payment-status"/><p className="help">For returns from bank or 3D Secure verification. Your page should handle succeeded, failed, and canceled outcomes.</p></>}
    </section>
    <section className="card">
      <div className="section-heading"><span className="step">2</span><h2>Place it on your page</h2><button className="text-button" disabled={busy || !inDesigner} onClick={() => void run(async () => { const selected = await selectedConfig(); if (!selected) throw new Error('Select an existing Whop checkout first.'); setConfig(selected); return 'Loaded the selected checkout.'; })}>Load selected</button></div>
      <div className={`checkout-preview ${config.mode}`}><span className="eyebrow">{config.environment === 'sandbox' ? 'SANDBOX PREVIEW' : 'PRODUCTION PREVIEW'}</span>{config.mode === 'button' ? <span className="sample-button">{config.label || 'Buy now'} <span>↗</span></span> : <div className="embed-preview"><strong>Your Whop checkout</strong><p>Price and payment methods come from your plan.</p><span className="preview-line"/><span className="preview-line short"/></div>}</div>
      <p className="help">Select a section or container in Webflow. Style the added element with the usual Designer controls.</p>
      <button className="primary" disabled={busy || !inDesigner || (config.mode === 'embed' && !installed)} onClick={() => void run(async () => { await insertCheckout(config); return 'Checkout added. Publish your site to try it live.'; })}>{busy ? 'Working…' : `Add ${config.mode === 'button' ? 'checkout button' : 'embedded checkout'}`}</button>
      <div className="button-row"><button disabled={busy || !inDesigner} onClick={() => void run(async () => { await updateCheckout(config); return 'Selected checkout updated.'; })}>Update selected</button><button disabled={busy} onClick={preview}>Open checkout ↗</button></div>
    </section>
    <section className="card connection"><div className="section-heading"><span className={`dot ${connected ? 'on' : ''}`}/><h2>{connected ? 'Site connected' : 'Connect embedded checkout'}</h2></div><p className="help">Authorize Webflow once to install the checkout scripts. Hosted checkout buttons work without this step.</p>
      <div className="button-row"><a className="button" href={`${__API_ORIGIN__}/auth/start`} target="_blank" rel="noreferrer">Connect Webflow ↗</a><button disabled={busy || !inDesigner} onClick={() => void run(() => api('status'))}>Check connection</button></div>
      {connected && <button className="primary" disabled={busy || installed} onClick={() => void run(() => api('install'))}>{installed ? 'Embedded checkout enabled' : 'Enable embedded checkout'}</button>}
      {connected && <details><summary>Remove integration</summary><p className="help">Removes this app’s checkout scripts from the site. Publish afterward, then remove any checkout elements in the Designer and uninstall the app.</p><button disabled={busy} onClick={() => void run(() => api('disconnect'))}>Remove scripts and disconnect</button></details>}
    </section>
    {message && <div role={error ? 'alert' : 'status'} className={`notice ${error ? 'error' : 'success'}`}>{message}</div>}
    <footer><a href={REFERRAL_URL} target="_blank" rel="sponsored noreferrer">Start selling with Whop ↗</a><span className="disclosure">I may earn a commission.</span><div><a href={`${__API_ORIGIN__}/guide.html`} target="_blank" rel="noreferrer">Setup guide</a><span>·</span><a href={`${__API_ORIGIN__}/privacy.html`} target="_blank" rel="noreferrer">Privacy</a><span>·</span><a href="https://github.com/yshmarov" target="_blank" rel="noreferrer">By Yaroslav Shmarov</a></div></footer>
  </main>;
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<App/>);
