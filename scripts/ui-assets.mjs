import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { gray, grayDark, orange, orangeDark, blue, blueDark, amber, amberDark, green, greenDark, red, redDark } from '@frosted-ui/colors';

// Semantic roles match whoptools/whoptools.com/scripts/theme.mjs.
const palette = (g, o, b, a, success, danger, background) => ({
  background, text: g.gray12, muted: g.gray11, border: g.gray6, control: g.gray9,
  surface: g.gray3, subtle: g.gray2, link: b.blue11, focus: b.blue11,
  primary: o.orange9, 'primary-hover': o.orange10, 'primary-text': '#000000',
  warning: a.amber11, success: success.green11, danger: danger.red11,
});
export const themes = {
  light: palette(gray, orange, blue, amber, green, red, '#ffffff'),
  dark: palette(grayDark, orangeDark, blueDark, amberDark, greenDark, redDark, grayDark.gray1),
};
const declarations = theme => Object.entries(themes[theme]).map(([name, value]) => `--ui-${name}:${value};`).join('');

export async function buildUiAssets() {
  await mkdir('public/fonts', { recursive: true });
  await mkdir('public/licenses', { recursive: true });
  await copyFile('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'public/fonts/inter-latin.woff2');
  await copyFile('node_modules/@fontsource-variable/inter/LICENSE', 'public/licenses/inter.txt');
  await copyFile('node_modules/@frosted-ui/colors/LICENSE', 'public/licenses/frosted-colors.txt');
  await writeFile('public/theme.css', `/* Generated from official Frosted UI palettes. */
@font-face{font-family:'Inter Variable';font-style:normal;font-weight:100 900;font-display:swap;src:url('./fonts/inter-latin.woff2') format('woff2')}
:root{color-scheme:light;${declarations('light')}}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){color-scheme:dark;${declarations('dark')}}}
:root[data-theme=dark]{color-scheme:dark;${declarations('dark')}}
`);
}
