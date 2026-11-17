# Frosted UI local review

Prepared November 17, 2026. No deployment or Webflow extension upload has been performed for this migration.

The Designer panel uses pinned Frosted UI components for buttons, fields, selects, tabs, headings, badges, and feedback. App appearance follows the Webflow host where supported, with a system fallback and saved Light/Dark overrides. Checkout appearance remains a separate merchant setting. Static service pages use the same official palettes and self-hosted Inter without a React runtime.

Local review addresses:

- App: http://localhost:4322/extension/
- Homepage: http://localhost:4322/
- Setup guide: http://localhost:4322/guide.html

The local preview service has no Webflow client credentials or saved production connections. Designer insertion, connection, and removal require the real Webflow host. The existing untracked Terms draft remains untouched.

## Verified

- Type checking, lint, build, and 23 tests pass, including theme precedence and unavailable-storage fallback.
- Browser review at the 480 px Designer panel width and a 320 px narrow layout; no horizontal overflow observed.
- Light/dark switching, saved choice after reload, and matching service-page themes.
- Keyboard navigation between checkout tabs, accessible validation feedback, and separation of app theme from checkout appearance.
- No browser console warnings or errors during the local checks; generated theme CSS and self-hosted font serve successfully.
- New checkout button styles use the official orange palette. Existing style reuse and update behavior is preserved.

The new host-theme subscription and Designer-only actions have not been exercised in a live Webflow session with this build. Run that integration smoke test after local visual review, before releasing.

## Release boundary

The existing 0.1.4 ZIPs are unchanged:

- `bundle.zip`: `81bc1da1e6c3a43165ea6f41d66eefc9aeed96dcfc27c1bdb2d5698db0b34faf`
- `review.zip`: `f108cdc67803fa9bee450b56c5e7d32e6c037e6cf0f96cff799c64f41d342d10`

These frozen ZIPs do not contain this migration. After approval, use a new release version, build with the production origin, regenerate matching bundle/review ZIPs and screenshots, and update the reviewer walkthrough. Leave any PR for the user's review and merge.
