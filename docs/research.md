# Webflow × Whop implementation notes

Researched November 15, 2026.

## Product boundary

The first release adds hosted-checkout buttons and embedded checkout elements from the Designer. A merchant supplies a public Whop plan ID; Whop owns prices, checkout, subscriptions, and fulfillment of Whop-hosted products. There is no merchant Whop API key in the app. This is independent commerce, not a replacement payment gateway for Webflow Ecommerce, a Webflow membership gate, or a CMS synchronization service.

A product catalog picker and CMS synchronization would be a separate feature: they require Whop authorization, additional Webflow scopes, secure token storage, and lifecycle/webhook processing. They are deliberately not advertised by this version.

## Architecture

- A React/TypeScript Designer Extension creates native DOM elements using Webflow's Designer API. Settings live in named data attributes, so they travel with the site and can be inspected in the Designer.
- A Node/Express Data Client handles Webflow OAuth and site-level Custom Code registration. Site tokens are encrypted with AES-256-GCM in SQLite. The deployment must have a persistent disk and one process; horizontal scaling requires a shared database and distributed locking.
- Every Designer-originated server action verifies the current ID token with Webflow and compares the verified site ID with the requested site. CORS uses exact extension origins.
- The registered custom-code script is a content-addressed initializer bundling Whop’s official `loadWhop()` loader. It loads the payment SDK directly from Whop’s release-train CDN only on pages containing embeds. Installation is idempotent and preserves unrelated custom scripts. Removal happens before disconnect; users publish the removal in Webflow. Checkout nodes remain editable and are removed in the Designer.
- No payment or order data enters the service. Fulfillment outside Whop requires the merchant's separate verified webhook integration. Browser redirects are not proof of payment.

## Platform requirements

1. A hybrid app registration with Designer Extension + Data Client.
2. `authorized_user:read`, `sites:read`, `custom_code:read`, and `custom_code:write`. Custom Code requires OAuth, not a pasted site API token.
3. HTTPS service URL, exact OAuth callback, extension-origin allowlist, persistent storage, and an encryption key.
4. Account two-factor authentication before uploading an extension. This account's upload control was disabled until 2FA setup.
5. A site/workspace that allows custom code for the embedded mode. A normal link button does not need custom code.
6. A durable production host before Marketplace submission. A temporary development tunnel is only for local testing.

## Marketplace artifacts

- Production extension ZIP without source maps, below Webflow's size limit.
- Private review ZIP containing source maps for the exact submitted build, manifests, lockfile, and relevant source.
- Published `.webflow.io` test site with the app installed and usable review access.
- App icon, screenshots with alt text, install URL, support contact, privacy information, and listing copy describing the checkout script and Whop SDK.
- Required App Review Preflight receipt for a Designer Extension / Custom Code app.
- Re-review for material code or scope changes. The app’s own runtime uses a content-addressed URL and SRI. Whop’s official loader manages its release-train SDK; pinning that mutable CDN URL to a one-time SRI hash would break checkouts whenever Whop ships an update. Increment the registered runtime version when app code changes.

## Sources

- [Webflow app registration](https://developers.webflow.com/apps/data/docs/register-an-app)
- [Webflow Custom Code lifecycle](https://developers.webflow.com/data/docs/working-with-custom-code)
- [Webflow ID-token verification](https://developers.webflow.com/data/v2.0.0-beta/reference/token/resolve)
- [Extension publishing and 2FA](https://developers.webflow.com/apps/docs/publishing-your-app)
- [Marketplace guidelines](https://developers.webflow.com/apps/docs/marketplace-guidelines)
- [Marketplace submission](https://developers.webflow.com/apps/docs/marketplace/submitting-your-app)
- [Whop Checkout Elements](https://docs.whop.com/developer/guides/embed-checkout)
- [Whop sandbox](https://docs.whop.com/developer/guides/sandbox)
