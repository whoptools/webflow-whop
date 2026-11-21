# Deploy on Hetzner

This Compose deployment runs one Node service behind Caddy. Only ports 80 and 443 are public. Caddy obtains and renews HTTPS certificates; SQLite, previously published checkout scripts, and TLS state survive container replacement.

## Automatic deployments on the shared server

Pushes to `whoptools/webflow-whop` `main` deploy automatically after CI passes:
type checking, lint, tests, extension bundle, container checks, persistent storage
checks, and deployment failure/rollback tests. Pull requests never
receive the deployment key. This updates the hosted service; Webflow extension
uploads and Marketplace submission remain separate.

GitHub secrets `HETZNER_DEPLOY_KEY` and `HETZNER_KNOWN_HOSTS` contain a dedicated
SSH key and pinned server host key. The `webflow-whop-deploy` Unix account's key
allows only `/usr/local/sbin/webflow-whop-deploy 'deploy <commit SHA>'`, with no
forwarding or interactive shell. The root-owned script is installed from
`deploy/hetzner.sh`; changing that script requires an operator to reinstall it.
It fetches the exact public-repository commit and verifies it is still `main`.

The deployment builds an image with the resource-limited `webflow-whop-builder`,
then replaces the container without taking a database backup. It uses
`deploy/compose.storage.yaml` to require the existing `webflow-whop_app_data`
volume and stable secret files. Health or activation failure restores the
previous app image while retaining the current database.

Releases live under `/opt/webflow-whop/releases/<commit>`, with `current`
pointing to the healthy release. `/opt/webflow-whop/.env` remains the source of
runtime settings. Secrets stay in `/opt/webflow-whop/secrets`. This demo has no
scheduled or deployment-time backups by owner decision on November 17, 2026.

Deployments share `/opt/pay-whop/shared/deploy.lock` with pay-whop, serializing
builds and activation across both apps. The proxy and other app are not
restarted. Container replacement can briefly interrupt requests. Old checkout
scripts and encrypted connections persist in the existing volume.

Monitor the **Deploy to Hetzner** CI job; rerun failed jobs to retry. Superseded
commits are skipped. Keep previous releases and images for rollback. For an
operator deployment of the current, CI-verified main commit:

```sh
ssh root@188.245.75.73 "/usr/local/sbin/webflow-whop-deploy 'deploy <40-character SHA>'"
```

A release with irreversible schema changes needs its own database recovery plan.

## Existing Kamal server

On a host already running Kamal Proxy, use the override instead of starting Caddy:

```sh
docker compose -f compose.yaml -f deploy/compose.kamal.yaml up -d --no-build --wait app
docker exec kamal-proxy kamal-proxy deploy whoptools-wf-checkout \
  --target webflow-whop-app:4319 --host webflow-checkout.whoptools.com --host wf-checkout.whoptools.com \
  --tls --health-check-path /health
```

Build and tag the image first, using the same permanent URL. This override joins the existing `kamal` network, publishes no additional ports, limits the app to 512 MB RAM and half a CPU, and adds a separate hostname route. Existing services and proxy settings remain in place. Use both `-f` arguments for subsequent backup, restart, and upgrade commands.

On a shared host, build in a separate resource-limited builder rather than changing the existing Kamal builder:

```sh
docker buildx create --name webflow-whop-builder --driver docker-container \
  --driver-opt memory=1g,memory-swap=1536m,cpu-quota=100000,cpu-period=100000
docker buildx build --builder webflow-whop-builder --load \
  --build-arg PUBLIC_URL=https://wf-checkout.whoptools.com \
  -t whop-checkout:0.1.5 .
docker buildx stop webflow-whop-builder
```

The canonical hostname is `wf-checkout.whoptools.com`; `webflow-checkout.whoptools.com` remains a legacy alias. Temporary, uncached browser redirects include a fresh canonical URL so returning visitors do not loop through permanent redirects cached during the earlier move.

For a domain migration, keep the previous hostname routes and set `LEGACY_HOSTS` to their comma-separated hostnames. Browser pages redirect to the new domain before OAuth cookies are created; previously published runtime URLs continue serving their original files.

Current hostnames (cutover November 18, 2026): `APP_DOMAIN=webflow-checkout.whoptools.com` is canonical, and the Webflow app's OAuth redirect URI is `https://wf-checkout.whoptools.com/auth/callback`. `wf-checkout.whoptools.com`, `webflow.whoptools.com` and `webflow-whop.superails.com` are listed in `LEGACY_HOSTS`: browser GET/HEAD requests receive a 308 to the canonical host, while `/runtime/*` scripts (referenced by published merchant sites), API calls and `/health` are served in place. Keep those routes and DNS records.

The standalone Caddy instructions below apply only to a dedicated host with free HTTP/HTTPS ports.

## Prepare the host

Use a Linux server with Docker Engine and the Compose plugin. Point a domain's A record to the server; add an AAAA record only when IPv6 is configured. Permit HTTP/HTTPS and restrict SSH to trusted administrator addresses. If the server already has a reverse proxy, integrate with it instead of starting another process on ports 80/443.

Clone this repository into `/opt/whop-checkout`, then work from that directory:

```sh
cp deploy/production.env.example .env
chmod 600 .env
install -d -m 700 secrets
```

Set `APP_DOMAIN`, `WEBFLOW_CLIENT_ID`, and the exact `EXTENSION_ORIGINS` in `.env`. Store the Webflow client secret in `secrets/webflow_client_secret` and the 64-character encryption key in `secrets/token_encryption_key`. If migrating the development database, preserve its original encryption key. Otherwise generate a new one with `openssl rand -hex 32`.

The container runs as UID 1000. On Linux, Compose file secrets retain the host file ownership:

```sh
sudo chown 1000:1000 secrets/webflow_client_secret secrets/token_encryption_key
sudo chmod 600 secrets/webflow_client_secret secrets/token_encryption_key
docker compose config --quiet
docker compose up -d --build --wait
```

Check `https://YOUR_DOMAIN/health`. Configure Webflow's callback as `https://YOUR_DOMAIN/auth/callback` and update the app homepage. The app trusts one reverse-proxy hop only because Compose exposes no app port; do not expose the Node container directly.

## Release the matching extension

Build the extension with the same permanent `PUBLIC_URL`, then run `npm run bundle` and `npm run review`. Upload `bundle.zip` for internal testing and verify the installed app before Marketplace submission. Give Webflow the matching `review.zip` privately.

Increase the registered runtime version in `server/app.ts` when its URL or content changes. The service archives content-addressed runtime files into its data volume at startup, preserving scripts for sites still using an older release.

## Optional database export for other installations

```sh
docker compose exec -T app node scripts/backup.mjs
```

The hosted demo does not run this utility automatically. It uses SQLite's online backup API, includes committed WAL data, and checks the backup's integrity. It writes to `/app/data/backups` with private permissions. Copy backups off the server and keep the encryption key in a separate secure backup. Hetzner daily server backups are an additional recovery option; a backup on the same disk alone does not protect against server loss.

For restoration, stop the app, preserve the current data volume, and restore a verified snapshot as `app.sqlite` in a fresh volume using UID 1000. Do not combine a restored database with another database's `-wal` or `-shm` files. Restore the matching encryption key and retained `runtime` directory before restarting. Never run `docker compose down --volumes` against the production deployment.

## Upgrade

Check out the reviewed release, set its `APP_IMAGE_TAG`, and run `docker compose up -d --build --wait`. Verify health and a sandbox checkout. Retain the previous image tag for rollback; use the same data volume and encryption key. Future schema migrations need an explicit rollback plan.

## References

- [Hetzner server creation](https://docs.hetzner.com/cloud/servers/getting-started/creating-a-server/)
- [Caddy with Docker Compose](https://caddyserver.com/docs/running#docker-compose)
- [Docker Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/)
