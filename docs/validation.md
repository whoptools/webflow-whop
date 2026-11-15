# Validation and launch status

Tested November 15, 2026:

- Registered the hybrid app and completed site-specific OAuth on Whop Commerce Demo.
- Verified a real Designer identity token with Webflow before accessing site scripts.
- Added a native checkout button; loaded it and updated its label.
- Registered and applied custom code on the Starter demo site through the official API.
- Added an embedded checkout and published the staging site.
- Loaded the sandbox checkout on the published `.webflow.io` site.
- Completed a sandbox payment from the local embedded preview using Whop's test card.
- 16 automated tests cover validation, encrypted credentials, OAuth state, cross-site access, script merging, first-install API behavior, and public runtime CORS.
- Type checking, linting, extension bundle, and private review packaging pass.

The development backend and current published embed depend on a temporary tunnel to the developer's Mac. Hosted checkout buttons work independently of that backend. The demo is a test page, not a production storefront.

## Before public installation

- Enable Webflow account 2FA to upload the extension.
- Deploy to a permanent HTTPS host with a persistent database and backed-up encryption key.
- Rebuild with the permanent URL; update OAuth callback and app homepage.
- Increment the runtime version for any changed registered URL or content. Keep previously published content-addressed runtime files available during upgrades.
- Test script removal/reconnection, failed payments, responsive checkout, and the installed bundle on the permanent host.
- Upload the extension and complete Marketplace preflight and review with the matching private source archive.

CI builds and smoke-tests the Dockerfile. Local Docker testing requires a running Docker daemon. The initial dependency audit reports five low-severity production advisories in the Webflow SDK dependency tree; development CLI dependencies also have advisories. Recheck before release; do not force incompatible dependency downgrades.
