# Contributing

Thanks for helping improve Whop Checkout for Webflow, part of [WhopTools](https://whoptools.com).

## Develop

Requires Node 22.13+ and npm. Follow [Develop](README.md#develop) to configure `.env`, then run:

```sh
npm ci
npm run build
npm run typecheck
npm run lint
npm test
```

`/extension/` renders the Designer panel and `/` renders the service pages. Insertion, OAuth and custom-code installation need the real Webflow Designer; test them with your own site and a Whop **sandbox** plan.

## Interface

The panel uses official [Frosted UI](https://github.com/whopio/frosted-ui) components. Shared tokens, Inter and the WhopTools header/footer live in `public/whoptools/`, vendored from [whoptools.com](https://github.com/whoptools/whoptools.com); change them there, not here. Check light and dark system themes and a narrow panel.

## Pull requests

Keep changes focused. Describe the behavior change and how you verified it, distinguishing automated tests from real Designer checks. Never commit credentials, tokens, encryption keys or customer data.

## Issues

Use the [issue forms](https://github.com/whoptools/webflow-whop/issues/new/choose). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). By participating you agree to the [code of conduct](CODE_OF_CONDUCT.md).
