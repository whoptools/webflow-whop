# Marketplace submission

App: **Whop Checkout** · Creator: **Yaroslav Shmarov** · Brand: **WhopTools**

- Category: Ecommerce
- Pricing: Free (all app features; separate Webflow and Whop charges may apply)
- Visibility: Public submission in preparation
> November 27, 2026: `https://wf-checkout.whoptools.com` is canonical. The form rejects the longer `webflow-checkout` hostname; its homepage/install URL warnings clear with `wf-checkout`. Marketplace submission remains pending the preflight receipt, file uploads and acknowledgements.

- Homepage: https://wf-checkout.whoptools.com
- Installation: https://wf-checkout.whoptools.com/auth/start
- Documentation: https://wf-checkout.whoptools.com/guide.html
- Privacy: https://wf-checkout.whoptools.com/privacy.html
- Terms: https://wf-checkout.whoptools.com/terms.html
- Published test site: https://whop-commerce-demo.webflow.io
- Reviewer video: https://drive.google.com/file/d/16sx3B6fjjTH01JrR8lCNtNa26SgEJOvY/view
- Support: yshmarov@gmail.com

## Listing copy

Short description: Add Whop checkout buttons and embedded payments directly in the Designer.

Add Whop checkout to your Webflow site without writing code.

Paste a Whop plan ID or checkout link, choose a button or an embedded checkout, and place it on your page. Style buttons in the Designer and choose a light or dark embedded checkout. Test in Whop's sandbox before switching to production.

Embedded checkout uses Whop's payment components. The app installs a checkout script through Webflow's Custom Code API. Publish your site to apply installation or removal.

All app features are free. Separate Webflow and Whop charges may apply. Whop processes payments and manages its product access; this integration does not create Webflow Ecommerce orders or protect Webflow pages.

Features: Native checkout buttons; Embedded payments; Sandbox testing; Editable checkout elements; One-click script setup.

## Permissions

- `authorized_user:read`: verify Designer identity using `POST /beta/token/resolve` before site actions.
- `sites:read`: list authorized sites using `GET /v2/sites`.
- `custom_code:read`: read applied scripts using `GET /v2/sites/:site_id/custom_code`.
- `custom_code:write`: register the versioned hosted runtime with `POST /v2/sites/:site_id/registered_scripts/hosted`, then apply/remove it using `PUT /v2/sites/:site_id/custom_code`, preserving unrelated scripts.

## Review access

No separate WhopTools credentials, paid tier, or merchant API key are required. Reviewers use their Webflow session and authorize their test site. Sandbox plan: `plan_k93fhdUPKYJH2`. Select Sandbox in the app. All features are free.

The existing sandbox plan belongs to the original test organization. Use **WhopTools** whenever a new sandbox or production Whop organization is needed.

## Submission assets

- `docs/assets/Whop Checkout icon.png`: approved checkout-card logo with the Whop mark, 900×900 opaque PNG below the form's 50 KB limit. Pristine artwork remains in `docs/assets/icon.png` and `docs/assets/brand/`.
- `public/icon.png`: matching 256×256 app icon for Webflow settings.
- Original artwork with and without the Whop mark: `docs/assets/brand/`.
- `docs/assets/marketplace/01-checkout-buttons.jpg`: Configure a native checkout button in the Designer.
- `docs/assets/marketplace/02-embedded-checkout.jpg`: Configure an embedded checkout and appearance.
- `docs/assets/marketplace/03-script-setup.jpg`: Enable the checkout runtime for a connected site.
- `docs/assets/marketplace/04-published-checkout.jpg`: Whop payment fields on the published Webflow demo.
- `site/review/walkthrough.mp4`: 3:16 English narration over current-release captures, including OAuth approval and denial.
- `site/review/walkthrough.vtt`: English captions.
- `bundle.zip` and `review.zip`: matching private production artifacts; not tracked in Git.

## Pending

Run App Review Preflight with the exact bundle/review ZIPs below, add its receipt,
and upload the icon, four screenshots and private source-map artifact. Confirm
standing review access and the final agreement before submission. The form draft
has the current URLs, reviewer video, minimum scopes and review notes saved.

The automated browser cannot open the preflight or embedded form file pickers;
manual file selection is required. No submission has been sent. The new reviewer
video is live on the existing Drive link (anyone with the link can view); updating
the separately hosted `/review/` copy awaits this media PR's merge and deployment.

## Version 0.1.5 artifact checksums

- `bundle.zip` SHA-256: `7ce80efaf6aa4515b177c7d8e080acaa31a0b19ac8c8c659e1bf337385d3f1b5`
- `review.zip` SHA-256: `fb6335f528c00ccdd5d8cb16d0b32c2d128c52fedeaaf64a97dcf342e7f1e324`

## Approved logo refresh — November 19, 2026

The Whop-mark checkout-card icon is saved in the Webflow app settings. The
Designer panel, service pages, favicon, README and current Marketplace icon
assets use the same approved artwork in the logo-refresh branch. Both original
variants are preserved in `docs/assets/brand/`. Historical review captures remain
unchanged. Hosted pages and the installed extension receive the updated assets
after the source PR is merged. The replacement Designer extension bundle is
already published for internal workspace testing.

Matching production artifacts, built with
`PUBLIC_URL=https://webflow-checkout.whoptools.com`:

- `bundle.zip` SHA-256: `5287a472b0435e7e208204d82b6be6fd3cafc2f3aa1c55ae8395ac151ee74968`
- `review.zip` SHA-256: `ec574b94f9ad4e4116d78da0b31359a872c80554e2c2bcf28874af1f053ecd0e`

The production bundle was uploaded for internal workspace testing on November
19, 2026. Webflow's version history shows the logo refresh and source revision
`dbbcde612402a8d1fc5a85b10693698c9e00e215`. The app icon is saved in app settings.
The private review package is prepared; Marketplace submission remains separate.

## Submission refresh — November 19, 2026

The owner chose to return to **https://wf-checkout.whoptools.com** after the form
rejected `webflow-checkout.whoptools.com` for containing the Webflow name. The
provider homepage/callback and production canonical host are restored. The
newer hostname remains an alias. The form's trademark warning clears for the
restored homepage/install URLs.

The branch adds uncached temporary legacy redirects with a fresh canonical URL
to break permanent redirects cached during the earlier hostname move. The
existing published runtime remains served in place. Deployment builds and
health checks use `wf-checkout.whoptools.com`.

The four listing screenshots are refreshed with the approved logo. The
replacement narration is prepared; final OAuth captures and video rendering
follow the permission change's deployment. The branch removes unused
`sites:write`, prepares the existing Terms draft for publication, and advances
registered runtime version to 0.1.5 for the hostname transition.

The form is authenticated, client ownership is verified, and listing text,
features, URLs and backend metadata are entered. Preflight receipt, file
uploads, final video link, standing review-access confirmation and the final
agreement remain pending. File pickers in the current browser integration did
not open for preflight or the embedded submission form. No submission has been
sent; the final production bundle/review package must match the released source.

## Current review build — November 27, 2026

- Source and deployed backend: `937e454b4703043659177cbbcffeb5230613b349`.
- Production and extension build origin: `https://wf-checkout.whoptools.com`.
- `bundle.zip` SHA-256: `01fa74b128d0f5496474eab73962829e6ef644bd6639c560ad9291837821b7ba`.
- `review.zip` SHA-256: `421330d4de8e252beb0bd18dba6bf54afe251aae050a7549e5357dea33a1f7a5`.
- Extension uploaded for internal workspace testing on November 27; version
  history records the source and bundle hash. This is separate from review distribution.
- Configured scopes: Authorized user read, Sites read, Custom Code read/write.
  Approval and cancellation both pass; site connection and runtime installation
  pass with these scopes. The sandbox demo was republished with the current runtime.
- Typecheck, lint and all 22 tests pass. Icon and screenshot limits pass.
- New 3:16 walkthrough uploaded as a replacement version of the existing Drive
  video; the previous version remains in Drive history and Git history. Playback
  and anyone-with-link viewer access were verified in the browser.

The earlier hostname transition left permanent redirects cached in this browser
for both bare homepages; a fresh canonical query URL works. Fresh HTTP requests
receive the intended temporary uncached redirect. Preserve the alias routes and
published runtimes; do not reintroduce permanent redirects during the transition.
