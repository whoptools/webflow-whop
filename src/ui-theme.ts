export type ThemeChoice = 'system' | 'light' | 'dark';
export type Appearance = 'light' | 'dark';
export const THEME_KEY = 'whoptools-ui-theme';

export function parseTheme(value: unknown): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveTheme(choice: ThemeChoice, systemDark: boolean, host?: Appearance): Appearance {
  return choice === 'system' ? host ?? (systemDark ? 'dark' : 'light') : choice;
}

export function readTheme(): ThemeChoice {
  try { return parseTheme(localStorage.getItem(THEME_KEY)); } catch { return 'system'; }
}

export function saveTheme(choice: ThemeChoice): void {
  try { localStorage.setItem(THEME_KEY, choice); } catch { /* The selection still works without storage. */ }
}

export function applyTheme(appearance: Appearance): void {
  document.documentElement.dataset.theme = appearance;
  document.documentElement.classList.toggle('dark', appearance === 'dark');
  document.documentElement.classList.toggle('light', appearance === 'light');
  document.documentElement.style.colorScheme = appearance;
}
