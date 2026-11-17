# Validation and launch status

## Frosted UI 0.1.5

Verified November 17, 2026: type checking, lint, 23 tests, production bundle and review packaging pass. The uploaded internal extension passes live host-theme synchronization, app overrides, button/embed insertion and updates, style preservation, disconnect/reconnect, and script reinstallation. The restored published demo renders its sandbox checkout. See [detailed results](frosted-ui-review.md).

The server checks below describe the previous 0.1.4 deployment; service rollout follows the reviewed 0.1.5 merge.

## Existing production baseline

Verified November 16, 2026, for version 0.1.4:

- The app runs at https://wf-checkout.whoptools.com on the existing Corsego Hetzner server, behind Kamal Proxy. Cloudflare DNS resolves to the existing server; HTTPS health checks pass.
- The previous webflow.whoptools.com and webflow-whop.superails.com browser URLs redirect to the final hostname. Old checkout runtime URLs remain available in place.
- The container uses encrypted SQLite credentials, persistent runtime storage, a 512 MB memory limit, half a CPU, and no published port. Existing Corsego continues to return HTTP 200.
- The final homepage and OAuth callback are saved in Webflow. Version 0.1.4 is uploaded for internal workspace testing.
- Browser OAuth approval and denial both pass on the final hostname. A canceled request produces a recovery message; approval returns to the connected page.
- The installed extension verifies the Designer identity, installs the final runtime, removes its scripts and stored connection, then reconnects and reinstalls successfully.
- The published https://whop-commerce-demo.webflow.io demo uses the final hostname's runtime with SHA-384 integrity and public CORS.
- The published embedded sandbox checkout rejects Whop's declined test card and successfully completes a payment with the successful test card. No real payment was made.
- The published checkout fits a 390-pixel mobile viewport without horizontal overflow.
- Earlier Designer tests added a native checkout button, loaded and updated its label, and added an embedded checkout.
- All 21 automated tests, type checking, linting, bundle generation, and matching private review packaging pass. GitHub CI also verifies Docker, Compose, and backup behavior.
- A daily systemd timer creates integrity-checked SQLite backups. A manual off-server recovery copy is preserved locally; recurring off-server backup automation is not configured.

## Marketplace status

- App Review Preflight was authorized on Whop Commerce Demo only, with the user's approval.
- Its upload controls do not open through the available browser automation. The required bundle/review ZIP upload and resulting receipt remain pending a manual upload.
- The official Marketplace submission draft contains the app details, verified client ID, exact permission mapping, pricing, and final URLs. It has not been submitted.
- The 900×900 icon is ready. The four listing screenshots and 3:10 narrated walkthrough were prepared for 0.1.4 and need refreshing for the Frosted UI release.
- The Terms page is drafted locally and shown to the owner. Publishing it and the final Marketplace agreement/standing review-access acknowledgement remain pending.
- Public Marketplace approval has not been granted. Do not describe internal extension upload as Marketplace publication.

The production dependency audit reports five low-severity advisories in the Webflow SDK dependency tree. Development CLI dependencies have additional advisories. Do not force incompatible dependency changes to silence the audit.
