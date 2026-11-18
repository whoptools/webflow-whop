# Security policy

Report suspected vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/whoptools/webflow-whop/security/advisories/new) (**Security → Report a vulnerability**). Do not open public issues for exploitable problems.

## Supported versions

Fixes target the current `main` branch, which is what `webflow-checkout.whoptools.com` runs, and the latest Designer Extension bundle.

## What to include

The affected page, endpoint or extension version; a minimal reproduction; expected and actual behavior; and the trust boundary involved (Webflow OAuth, Designer identity tokens, custom-code installation, encrypted token storage or the published checkout runtime). Use your own sites and sandbox plans. Never include Webflow tokens, Whop API keys, encryption keys, buyer data or card details. If a real credential was exposed, revoke it with the provider first.

You should receive an acknowledgement within a few days. Please allow time for a fix before public disclosure. This community project has not had an independent security audit.
