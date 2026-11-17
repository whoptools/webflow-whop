# Marketplace submission

App: **Whop Checkout** · Creator: **Yaroslav Shmarov** · Brand: **WhopTools**

- Category: Ecommerce
- Pricing: Free (all app features; separate Webflow and Whop charges may apply)
- Visibility: Public, pending Marketplace review
- Homepage: https://wf-checkout.whoptools.com
- Installation: https://wf-checkout.whoptools.com/auth/start
- Documentation: https://wf-checkout.whoptools.com/guide.html
- Privacy: https://wf-checkout.whoptools.com/privacy.html
- Terms: https://wf-checkout.whoptools.com/terms.html (local draft, publication pending)
- Published test site: https://whop-commerce-demo.webflow.io
- Reviewer video: https://wf-checkout.whoptools.com/review/
- Support: yshmarov@gmail.com

## Listing copy

Short description: Add Whop checkout buttons and embedded payments directly in the Designer.

Add Whop checkout to your Webflow site without writing code.

Paste a Whop plan ID or checkout link, choose a button or an embedded checkout, and place it on your page. Style buttons in the Designer and choose a light or dark embedded checkout. Test in Whop's sandbox before switching to production.

Embedded checkout uses Whop's payment components. The app installs a checkout script through Webflow's Custom Code API. Publish your site to apply installation or removal.

All app features are free. Separate Webflow and Whop charges may apply. Whop processes payments and manages its product access; this integration does not create Webflow Ecommerce orders or protect Webflow pages.

Features: Native checkout buttons; Embedded payments; Sandbox testing; Editable checkout elements; One-click script setup.

## Permissions

- `authorized_user:read`: verify Designer identity using `POST /beta/token/resolve` before site actions.
- `sites:read`: list authorized sites using `GET /v2/sites`.
- `sites:write`: register the versioned runtime using `POST /v2/sites/:site_id/registered_scripts/hosted`.
- `custom_code:read`: read applied scripts using `GET /v2/sites/:site_id/custom_code`.
- `custom_code:write`: apply/remove the app's scripts using `PUT /v2/sites/:site_id/custom_code`, preserving unrelated scripts.

## Review access

No separate WhopTools credentials, paid tier, or merchant API key are required. Reviewers use their Webflow session and authorize their test site. Sandbox plan: `plan_k93fhdUPKYJH2`. Select Sandbox in the app. All features are free.

The existing sandbox plan belongs to the original test organization. Use **WhopTools** whenever a new sandbox or production Whop organization is needed.

## Submission assets

- `docs/assets/Whop Checkout orange and blue WW icon.png`: 900×900, solid background, under 50 KB.
- `docs/assets/marketplace/01-checkout-buttons.jpg`: Configure a native checkout button in the Designer.
- `docs/assets/marketplace/02-embedded-checkout.jpg`: Configure an embedded checkout and appearance.
- `docs/assets/marketplace/03-script-setup.jpg`: Enable the checkout runtime for a connected site.
- `docs/assets/marketplace/04-published-checkout.jpg`: Whop payment fields on the published Webflow demo.
- `site/review/walkthrough.mp4`: 3:10 English narration over actual test captures.
- `site/review/walkthrough.vtt`: English captions.
- `bundle.zip` and `review.zip`: matching private production artifacts; not tracked in Git.

## Pending

Refresh the listing screenshots and narrated walkthrough for Frosted UI 0.1.5. Preflight receipt and file uploads, final terms publication, agreement acknowledgement, and submission remain pending. The form rejects hostnames containing the Webflow name; `wf-checkout.whoptools.com` resolves that issue. The form's pricing check misread merchant subscriptions as app pricing, so the listing now describes the checkout features and explicitly states that all app features are free.

## Version 0.1.5 artifact checksums

- `bundle.zip` SHA-256: `7ce80efaf6aa4515b177c7d8e080acaa31a0b19ac8c8c659e1bf337385d3f1b5`
- `review.zip` SHA-256: `fb6335f528c00ccdd5d8cb16d0b32c2d128c52fedeaaf64a97dcf342e7f1e324`
