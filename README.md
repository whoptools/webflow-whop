# Whop Checkout for Webflow

Add Whop checkout buttons and embedded payments from the Webflow Designer.

Built by [Yaroslav Shmarov](https://github.com/yshmarov), author of [omniauth-whop](https://github.com/yshmarov/omniauth-whop) and [pay-whop](https://github.com/yshmarov/pay-whop).

Hosted at [wf-checkout.whoptools.com](https://wf-checkout.whoptools.com) and available for internal Webflow workspace testing. Public installation is pending Webflow Marketplace review.

![Local Frosted UI preview of Whop Checkout](docs/screenshots/frosted-ui-preview.jpg)

## Features

- Hosted checkout buttons using native, styleable Webflow elements.
- Embedded Whop Checkout Elements, with sandbox/production separation and light/dark appearance.
- Load and update existing checkout elements.
- Webflow OAuth and verified Designer identity tokens.
- Versioned custom-script installation and removal that preserves other scripts.
- Encrypted server-side credentials. No merchant Whop API keys or payment details in the app.

This integration uses Whop checkout independently of Webflow Ecommerce. It does not sync CMS products, create Webflow orders, or gate Webflow pages. See [setup instructions](site/guide.html) and [implementation research](docs/research.md).

[Get started with Whop](https://whop.com/start/?code=CAKARK). *I may earn a commission.*

## Develop

Requires Node 22.13+ and npm.

```sh
npm ci
cp .env.example .env
openssl rand -hex 32
```

Put the generated value in `TOKEN_ENCRYPTION_KEY`. Set `PUBLIC_URL` to the HTTPS address of your development service. Register a Webflow hybrid app with the scopes in [the research notes](docs/research.md), use `PUBLIC_URL/auth/callback` as its redirect, and set the client ID and secret in `.env`. Add its exact Designer Extension origin to `EXTENSION_ORIGINS`.

```sh
npm run build
npm run dev
# Separate terminal:
npm run dev:extension
```

Authorize the app at `PUBLIC_URL/auth/start`. In the demo site's Designer, open Apps → Whop Checkout → Launch development App, using `http://localhost:1337`.

If your browser blocks the HTTP iframe, use `PUBLIC_URL/designer-dev/`. This development-only route proxies the official local extension server over your HTTPS tunnel.

The service defaults to port 4319. A shell-exported PORT overrides `.env`; use `PORT=4319 npm run dev` when needed. The standalone panel at `/extension/` previews the interface; Designer actions require the real Webflow host.

## UI and themes

The Designer panel uses Whop's `frosted-ui` React components. The service pages use official `@frosted-ui/colors` palettes and self-hosted Inter, following the [shared WhopTools style guide](https://github.com/whoptools/whoptools.com/blob/2771765/STYLE_GUIDE.md).

App theme follows Webflow's appearance when available, falling back to the device theme. Light and Dark override that default. The choice persists locally and is separate from the merchant's checkout appearance. Service pages offer System, Light, and Dark. New checkout button styles use Whop orange; existing merchant styles are preserved.

`npm run build` generates the component CSS, semantic theme CSS, font assets, licenses, and page-theme script alongside the JavaScript. Layout lives in `public/styles.css`; the static palette mapping lives in `scripts/ui-assets.mjs`. Preview with a local `PUBLIC_URL`; `/extension/` renders the panel and `/` renders the service homepage. Real insertion and connection actions require the Webflow Designer.

Version 0.1.5 passed live Webflow checks and is uploaded for internal workspace testing. See [validation results](docs/frosted-ui-review.md). Matching production bundle/review ZIPs are prepared; refresh Marketplace listing screenshots and the reviewer walkthrough before submission.

## Validate and bundle

```sh
npm run typecheck
npm run lint
npm test
npm run bundle
npm run review
```

`bundle.zip` contains only the extension. `review.zip` contains its matching source maps and source for Webflow's private review. Rebuild both together after any change. CI's development bundle uses localhost; it is not a Marketplace release artifact.

## Deploy

For Hetzner, use the included [Compose deployment and backup guide](docs/hetzner.md).

Use a durable HTTPS Node host with a persistent disk. SQLite is intended for one service process. Keep `DATA_DIR` and `TOKEN_ENCRYPTION_KEY` across deployments. Back up both securely; replacing the encryption key makes stored connections unreadable.

The Dockerfile accepts `PUBLIC_URL` as a build argument. Pass the same URL at runtime, plus the Webflow credentials, encryption key, exact extension origins, and the persistent data directory. Configure the actual reverse proxy's trusted address range when deploying; local development trusts loopback only. The public service must not expose its database or `.env` file.

Set Webflow's OAuth callback to the permanent host, rebuild the extension, and upload it from an account with two-factor authentication. Use the [Marketplace draft](docs/marketplace.md) to prepare review. The code includes no automatic site publication; publish deliberate site changes in Webflow.

## Checkout lifecycle

The merchant's plan defines the price. Test using a sandbox plan and sandbox cards. Changing the environment does not migrate a plan between Whop environments.

Return pages display payment outcomes; custom fulfillment must verify Whop webhooks on the merchant's server. Apple Pay needs Whop domain verification. To uninstall, remove scripts and disconnect in the app, publish, remove checkout elements, then uninstall in Webflow settings.

## License

MIT
