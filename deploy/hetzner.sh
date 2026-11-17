#!/usr/bin/env bash
set -euo pipefail

if [[ ${1:-} != deploy\ * ]] || [[ ! ${1#deploy } =~ ^[0-9a-f]{40}$ ]]; then
  echo 'Expected: deploy <40-character commit SHA>' >&2
  exit 64
fi
revision=${1#deploy }
base=/opt/webflow-whop
repository=https://github.com/whoptools/webflow-whop.git
# Serialize both apps' builds and activations on the shared server.
exec 9>/opt/pay-whop/shared/deploy.lock
flock -w 1800 9
latest=$(git ls-remote "$repository" refs/heads/main | cut -f1)
if [[ $revision != "$latest" ]]; then
  echo 'Skipping a superseded main revision.'
  exit 0
fi

release="$base/releases/$revision"
previous=$(readlink -f "$base/current")
activated=false
replacing=false
compose() {
  local directory=$1
  shift
  docker compose --project-name webflow-whop --env-file "$directory/.env" \
    -f "$directory/compose.yaml" -f "$directory/deploy/compose.kamal.yaml" \
    -f "$base/shared/compose.storage.yaml" "$@"
}
activate() {
  compose "$1" up -d --no-build --wait --wait-timeout 120 app
  docker exec kamal-proxy kamal-proxy deploy whoptools-wf-checkout \
    --target webflow-whop-app:4319 --host wf-checkout.whoptools.com --tls --health-check-path /health
}
cleanup() {
  local result=$?
  trap - EXIT
  docker buildx stop webflow-whop-builder >/dev/null 2>&1 || true
  if [[ $result != 0 && $replacing == true && $activated == false ]]; then
    echo 'Restoring the previous application release; keeping the current database.' >&2
    activate "$previous" || echo 'ROLLBACK FAILED: operator intervention required.' >&2
  fi
  exit "$result"
}
trap cleanup EXIT

install -d "$release"
curl --fail --silent --show-error --location --retry 3 \
  "https://codeload.github.com/whoptools/webflow-whop/tar.gz/$revision" \
  | tar -xz --strip-components=1 -C "$release"
awk '!/^APP_IMAGE_TAG=/' "$base/.env" > "$release/.env"
printf 'APP_IMAGE_TAG=%s\n' "$revision" >> "$release/.env"
chmod 600 "$release/.env"
compose "$release" config --quiet

docker buildx build --builder webflow-whop-builder --load \
  --build-arg PUBLIC_URL=https://wf-checkout.whoptools.com \
  -t "whop-checkout:$revision" "$release"
docker buildx stop webflow-whop-builder
latest=$(git ls-remote "$repository" refs/heads/main | cut -f1)
if [[ $revision != "$latest" ]]; then
  echo 'Skipping activation of a superseded main revision.'
  exit 0
fi

# Back up the running app before replacing its image, without exposing its tokens.
docker exec webflow-whop-app node scripts/backup.mjs
replacing=true
activate "$release"
curl --fail --silent --show-error --retry 5 --retry-all-errors --retry-delay 2 \
  --resolve wf-checkout.whoptools.com:443:127.0.0.1 https://wf-checkout.whoptools.com/health >/dev/null
ln -sfn "$release" "$base/current"
activated=true
printf 'Deployed %s to https://wf-checkout.whoptools.com/\n' "$revision"
