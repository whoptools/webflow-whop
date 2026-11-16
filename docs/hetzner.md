# Deploy on Hetzner

This Compose deployment runs one Node service behind Caddy. Only ports 80 and 443 are public. Caddy obtains and renews HTTPS certificates; SQLite, previously published checkout scripts, and TLS state survive container replacement.

## Existing Kamal server

On a host already running Kamal Proxy, use the override instead of starting Caddy:

```sh
docker compose -f compose.yaml -f deploy/compose.kamal.yaml up -d --no-build --wait app
docker exec kamal-proxy kamal-proxy deploy webflow-whop \
  --target webflow-whop-app:4319 --host wf-checkout.whoptools.com \
  --tls --health-check-path /health
```

Build and tag the image first, using the same permanent URL. This override joins the existing `kamal` network, publishes no additional ports, limits the app to 512 MB RAM and half a CPU, and adds a separate hostname route. Existing services and proxy settings remain in place. Use both `-f` arguments for subsequent backup, restart, and upgrade commands.

On a shared host, build in a separate resource-limited builder rather than changing the existing Kamal builder:

```sh
docker buildx create --name webflow-whop-builder --driver docker-container \
  --driver-opt memory=1g,memory-swap=1536m,cpu-quota=100000,cpu-period=100000
docker buildx build --builder webflow-whop-builder --load \
  --build-arg PUBLIC_URL=https://wf-checkout.whoptools.com \
  -t whop-checkout:0.1.4 .
docker buildx stop webflow-whop-builder
```

The standalone Caddy instructions below apply only to a dedicated host with free HTTP/HTTPS ports.

For daily verified database snapshots on the shared host, install the provided timer:

```sh
install -m 644 deploy/webflow-whop-backup.{service,timer} /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now webflow-whop-backup.timer
systemctl start webflow-whop-backup.service
systemctl list-timers webflow-whop-backup.timer
```

Snapshots stay in the app's data volume. Arrange off-server copies and preserve the encryption key separately; the timer alone does not protect against losing the server.

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

## Back up and restore

```sh
docker compose exec -T app node scripts/backup.mjs
```

This uses SQLite's online backup API, includes committed WAL data, and checks the backup's integrity. It writes to `/app/data/backups` with private permissions. Copy backups off the server and keep the encryption key in a separate secure backup. Hetzner daily server backups are an additional recovery option; a backup on the same disk alone does not protect against server loss.

For restoration, stop the app, preserve the current data volume, and restore a verified snapshot as `app.sqlite` in a fresh volume using UID 1000. Do not combine a restored database with another database's `-wal` or `-shm` files. Restore the matching encryption key and retained `runtime` directory before restarting. Never run `docker compose down --volumes` against the production deployment.

## Upgrade

Back up first. Check out the reviewed release, set its `APP_IMAGE_TAG`, and run `docker compose up -d --build --wait`. Verify health and a sandbox checkout. Retain the previous image tag for rollback; use the same data volume and encryption key. Future schema migrations need an explicit rollback plan.

## References

- [Hetzner server creation](https://docs.hetzner.com/cloud/servers/getting-started/creating-a-server/)
- [Caddy with Docker Compose](https://caddyserver.com/docs/running#docker-compose)
- [Docker Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/)
