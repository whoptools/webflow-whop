export type Appearance = 'light' | 'dark';

// Device preference is the sole source of app appearance. Old saved choices
// and the Designer's own manual appearance setting intentionally have no effect.
export function watchSystemTheme(onChange: (appearance: Appearance) => void,
  media: MediaQueryList = matchMedia('(prefers-color-scheme: dark)')): () => void {
  const update = () => onChange(media.matches ? 'dark' : 'light');
  media.addEventListener('change', update);
  update();
  return () => media.removeEventListener('change', update);
}
