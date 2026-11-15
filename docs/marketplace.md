# Marketplace submission draft

App name: **Whop Checkout**

Short description: Add Whop checkout buttons and embedded payments directly in the Designer.

## Description

Sell subscriptions, digital products, and services from your Webflow site with Whop Checkout.

Paste your Whop plan ID or checkout link, choose a button or an embedded checkout, and place it on your page. Style buttons in the Designer and choose a light or dark embedded checkout. Test with sandbox plans before switching to production.

Embedded checkout uses Whop's payment components. The app installs one checkout script in your site's footer through Webflow's Custom Code API. It loads Whop Elements through Whop's official loader and initializes the checkout elements you add; it does not read other forms. Removing the integration removes the script. Publish the site to apply installation or removal.

Whop handles the price and payment flow. This app does not create Webflow Ecommerce orders or protect Webflow pages. Embedded checkout requires custom-code access on your Webflow site or workspace.

## Permissions

- Authorized user: verify the person using the Designer.
- Sites: identify the authorized site and manage its checkout integration.
- Custom code: install and remove the checkout script.

## Assets and release gates

Fill these with the permanent deployment before submission:

- Homepage and install URL
- Privacy URL and support contact
- 256×256 app icon: `docs/assets/icon.png`
- Product screenshots and alt text
- Published `.webflow.io` testing site
- Durable sandbox review plan and reviewer instructions
- Final production bundle, matching private review ZIP, and preflight receipt
- Pricing: app is free; Whop payment fees and any required Webflow plan are separate

Do not submit a tunnel URL or a local-development bundle.
