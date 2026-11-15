# Validation and launch status

Tested November 15, 2026:

- Registered the hybrid app and completed site-specific OAuth on Whop Commerce Demo.
- Verified a real Designer identity token with Webflow before accessing site scripts.
- Added a native checkout button; loaded it and updated its label.
- Registered and applied custom code on the Starter demo site through the official API.
- Added an embedded checkout and published the staging site.
- Loaded the sandbox checkout on the published `.webflow.io` site.
- Completed a sandbox payment from the local embedded preview using Whop's test card.
- 20 automated tests cover validation, encrypted credentials, OAuth state, cross-site access, script merging, first-install API behavior, public runtime CORS, file-mounted secrets, proxy configuration, runtime retention, and verified database backups.
- Type checking, linting, extension bundle, and private review packaging pass.

Deployment verified November 16, 2026:

- The app runs at `https://webflow-whop.superails.com` on the existing Hetzner server, behind its existing Kamal Proxy.
- The container has persistent storage, encrypted migrated OAuth connections, a 512 MB memory limit, and no directly published port.
- Public HTTPS health checks pass; the existing Corsego site still returns HTTP 200.
- The checkout runtime passes its SHA-384 integrity check and has public CORS and immutable caching headers.
- A daily systemd backup timer is installed; a manual run produced an integrity-checked SQLite snapshot.
- Webflow's homepage and OAuth callback use the permanent hostname.
- Version 0.1.2 was uploaded for internal workspace testing; its hosted extension links to the permanent backend.
- Both implementation CI runs passed, including Docker, Compose, and backup smoke tests.

Final browser testing is temporarily blocked by a stale negative DNS response from the development Mac's resolver. Authoritative DNS, Cloudflare DNS, Google DNS, and the deployment server resolve the hostname correctly. The published demo still uses the previous runtime until the production connection is verified and its script is updated and republished. The demo is a sandbox test page.

## Before public installation

- Complete the permanent-host OAuth and installed-bundle browser checks once local DNS resolves.
- Update the demo's registered runtime to 0.1.2 and republish it.
- Arrange recurring off-server backups, including separate secure storage for the encryption key. Daily snapshots currently stay on the same server.
- Test script removal/reconnection, failed payments, responsive checkout, and the installed bundle on the permanent host.
- Complete Marketplace preflight and review with the matching private source archive.

CI builds and smoke-tests the Dockerfile. Local Docker testing requires a running Docker daemon. The initial dependency audit reports five low-severity production advisories in the Webflow SDK dependency tree; development CLI dependencies also have advisories. Recheck before release; do not force incompatible dependency downgrades.
