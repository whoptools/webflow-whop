# WhopTools kit

Vendored from [whoptools/whoptools.com](https://github.com/whoptools/whoptools.com) for `webflow`.
Do not edit these files here. Change `kit/` or `scripts/` in the website repository, then run:

```sh
node scripts/kit.mjs --product webflow --out <this directory>
```

`whoptools.css` contains Inter, the Frosted UI light/dark tokens (`--wt-*`), the shared header,
footer and button styles. `header.html` and `footer.html` are the shared navigation markup.
`create-whop-account.svg` is the signup button for Markdown READMEs.
See STYLE_GUIDE.md in the website repository for usage.
