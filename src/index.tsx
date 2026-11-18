import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge, Button, Callout, Heading, Select, SegmentedControl, Text, TextField, Theme } from 'frosted-ui';
import 'frosted-ui/styles.css';
import { useUiTheme } from './use-ui-theme';
import { DEFAULT_CONFIG, REFERRAL_URL, checkoutUrl, validateConfig, type CheckoutConfig } from './config';
import { insertCheckout, selectedConfig, updateCheckout } from './designer';
declare const __API_ORIGIN__: string;

function Choice<T extends string>({ id, value, onChange, options }: {
  id: string; value: T; onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return <Select.Root<T> value={value} onValueChange={next => { if (next !== null) onChange(next); }} items={options} size="2">
    <Select.Trigger id={id} className="field-select" />
    <Select.Content>{options.map(option => <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>)}</Select.Content>
  </Select.Root>;
}

function App() {
  const inDesigner = typeof webflow !== 'undefined';
  const ui = useUiTheme();
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
  return <Theme accentColor="orange" grayColor="gray" infoColor="blue" successColor="green" appearance="inherit" hasBackground={false} className={`checkout-theme ${ui.appearance}`}>
    <main className="app-shell">
      <header className="app-header">
        <img className="brand-mark" src="./icon.svg" alt="" />
        <div><Heading size="5" weight="semi-bold">Whop Checkout for Webflow</Heading><Text render={<p />} size="2" color="gray">Payments, right where you design.</Text></div>
        <Badge color="gray" variant="soft">Webflow</Badge>
      </header>
      <Button size="2" variant="solid" color="orange" className="signup-button" nativeButton={false} render={<a href={REFERRAL_URL} target="_blank" rel="sponsored noreferrer" />}>Create a Whop account</Button>
      {!inDesigner && <Callout.Root color="info" className="preview-notice"><Callout.Description>Preview mode · Open in Webflow to add checkout to your site.</Callout.Description></Callout.Root>}

      <section className="app-section" aria-labelledby="choose-heading">
        <div className="section-heading"><span className="step" aria-hidden="true">1</span><Heading render={<h2 />} id="choose-heading" size="3">Choose your checkout</Heading></div>
        <SegmentedControl.Root value={config.mode} onValueChange={(value: unknown) => { if (value === 'button' || value === 'embed') set('mode', value); }}>
          <SegmentedControl.List aria-label="Checkout type" className="checkout-type">
            <SegmentedControl.Trigger value="button">Checkout button</SegmentedControl.Trigger>
            <SegmentedControl.Trigger value="embed">Embedded checkout</SegmentedControl.Trigger>
          </SegmentedControl.List>
          <div className="field"><Text render={<label htmlFor="environment" />} size="2" weight="medium">Environment</Text>
            <Choice id="environment" value={config.environment} onChange={value => set('environment', value)} options={[{ value: 'sandbox', label: 'Sandbox · test payments' }, { value: 'production', label: 'Production · real payments' }]} />
          </div>
          <div className="field"><Text render={<label htmlFor="plan" />} size="2" weight="medium">Plan ID or checkout link</Text>
            <TextField.Input id="plan" value={config.plan} onChange={event => set('plan', event.target.value)} placeholder="plan_… or https://whop.com/checkout/…" autoComplete="off" spellCheck={false} aria-describedby="plan-help" />
            <Text render={<p />} id="plan-help" className="help" size="2" color="gray">Copy it from Checkout links in your <a href={config.environment === 'sandbox' ? 'https://sandbox.whop.com/dashboard' : 'https://whop.com/dashboard'} target="_blank" rel="noreferrer">Whop dashboard ↗</a>.</Text>
          </div>
          <SegmentedControl.Content value="button">
            <div className="field"><Text render={<label htmlFor="label" />} size="2" weight="medium">Button label</Text><TextField.Input id="label" maxLength={100} value={config.label} onChange={event => set('label', event.target.value)} /></div>
          </SegmentedControl.Content>
          <SegmentedControl.Content value="embed">
            <div className="field"><Text render={<label htmlFor="embed-label" />} size="2" weight="medium">Button label</Text><TextField.Input id="embed-label" maxLength={100} value={config.label} onChange={event => set('label', event.target.value)} /></div>
            <div className="field"><Text render={<label htmlFor="checkout-theme" />} size="2" weight="medium">Checkout appearance</Text>
              <Choice id="checkout-theme" value={config.theme} onChange={value => set('theme', value)} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Match visitor’s device' }]} />
            </div>
            <div className="field"><Text render={<label htmlFor="return" />} size="2" weight="medium">Return URL <Text color="gray">(optional)</Text></Text>
              <TextField.Input id="return" type="url" value={config.returnUrl} onChange={event => set('returnUrl', event.target.value)} placeholder="https://your-site.com/payment-status" aria-describedby="return-help" />
              <Text render={<p />} id="return-help" className="help" size="2" color="gray">For bank or 3D Secure verification. Handle succeeded, failed, and canceled outcomes on your page.</Text>
            </div>
          </SegmentedControl.Content>
        </SegmentedControl.Root>
      </section>

      <section className="app-section" aria-labelledby="place-heading">
        <div className="section-heading"><span className="step" aria-hidden="true">2</span><Heading render={<h2 />} id="place-heading" size="3">Place it on your page</Heading>
          <Button variant="ghost" color="gray" size="1" className="load-selected" disabled={busy || !inDesigner} onClick={() => void run(async () => { const selected = await selectedConfig(); if (!selected) throw new Error('Select an existing Whop checkout first.'); setConfig(selected); return 'Loaded the selected checkout.'; })}>Load selected</Button>
        </div>
        <div className="checkout-preview">
          <Text size="1" color="gray">{config.environment === 'sandbox' ? 'Sandbox preview' : 'Production preview'}</Text>
          {config.mode === 'button' ? <span className="sample-button">{config.label || 'Buy now'} <span aria-hidden="true">↗</span></span> : <div className={`embed-preview ${config.theme === 'system' ? ui.appearance : config.theme}`}><strong>Your Whop checkout</strong><p>Price and payment methods come from your plan.</p><span className="preview-line" /><span className="preview-line short" /></div>}
        </div>
        <Text render={<p />} className="help" size="2" color="gray">Select a section or container in Webflow. Style the added element with the Designer controls.</Text>
        <Button size="3" variant="solid" color="orange" className="full-width" loading={busy} disabled={busy || !inDesigner || (config.mode === 'embed' && !installed)} onClick={() => void run(async () => { await insertCheckout(config); return 'Checkout added. Publish your site to try it live.'; })}>Add {config.mode === 'button' ? 'checkout button' : 'embedded checkout'}</Button>
        <div className="button-row"><Button disabled={busy || !inDesigner} onClick={() => void run(async () => { await updateCheckout(config); return 'Selected checkout updated.'; })}>Update selected</Button><Button disabled={busy} onClick={preview}>Open checkout ↗</Button></div>
      </section>

      <section className="app-section connection" aria-labelledby="connect-heading">
        <div className="section-heading"><span className={`dot ${connected ? 'on' : ''}`} aria-hidden="true" /><Heading render={<h2 />} id="connect-heading" size="3">{connected ? 'Site connected' : 'Connect embedded checkout'}</Heading></div>
        <Text render={<p />} className="help" size="2" color="gray">Authorize Webflow once to install the checkout scripts. Checkout buttons work without this step.</Text>
        <div className="button-row"><Button render={<a href={`${__API_ORIGIN__}/auth/start`} target="_blank" rel="noreferrer" />} nativeButton={false}>Connect Webflow ↗</Button><Button disabled={busy || !inDesigner} onClick={() => void run(() => api('status'))}>Check connection</Button></div>
        {connected && <Button variant="solid" color="orange" size="3" className="full-width" disabled={busy || installed} onClick={() => void run(() => api('install'))}>{installed ? 'Embedded checkout enabled' : 'Enable embedded checkout'}</Button>}
        {connected && <details><summary>Remove integration</summary><Text render={<p />} className="help" size="2" color="gray">Removes this app’s checkout scripts. Publish afterward, remove its checkout elements, then uninstall the app.</Text><Button color="red" variant="soft" disabled={busy} onClick={() => void run(() => api('disconnect'))}>Remove scripts and disconnect</Button></details>}
      </section>
      {message && <Callout.Root role={error ? 'alert' : 'status'} color={error ? 'danger' : 'success'} className="notice"><Callout.Description>{message}</Callout.Description></Callout.Root>}
      <footer className="app-footer">
        <nav aria-label="Help"><a href={`${__API_ORIGIN__}/guide.html`} target="_blank" rel="noreferrer">Setup guide</a><a href={`${__API_ORIGIN__}/privacy.html`} target="_blank" rel="noreferrer">Privacy</a><a className="source-link" href="https://github.com/whoptools/webflow-whop" target="_blank" rel="noreferrer"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0c4.42 0 8 3.58 8 8a8.01 8.01 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82a7.6 7.6 0 0 0-4 0c-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A8 8 0 0 1 0 8c0-4.42 3.58-8 8-8Z" /></svg>Source code</a><a href="https://whoptools.com/" target="_blank" rel="noreferrer">WhopTools</a></nav>
      </footer>
    </main>
  </Theme>;
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<App/>);
