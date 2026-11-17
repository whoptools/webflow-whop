import { useEffect, useState } from 'react';
import { watchSystemTheme, type Appearance } from './ui-theme';

export function useUiTheme() {
  const [appearance, setAppearance] = useState<Appearance>(() => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  useEffect(() => watchSystemTheme(setAppearance), []);
  return { appearance };
}
