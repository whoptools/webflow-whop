import { useEffect, useState } from 'react';
import { applyTheme, readTheme, resolveTheme, saveTheme, THEME_KEY, type Appearance, type ThemeChoice } from './ui-theme';

export function useUiTheme(inDesigner: boolean) {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [host, setHost] = useState<Appearance>();
  const appearance = resolveTheme(choice, systemDark, host);

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const change = () => setSystemDark(media.matches);
    const storage = (event: StorageEvent) => { if (event.key === THEME_KEY || event.key === null) setChoice(readTheme()); };
    media.addEventListener('change', change);
    window.addEventListener('storage', storage);
    return () => { media.removeEventListener('change', change); window.removeEventListener('storage', storage); };
  }, []);

  useEffect(() => {
    if (!inDesigner || typeof webflow.getTheme !== 'function') return;
    let active = true;
    let changed = false;
    let unsubscribe: (() => void) | undefined;
    const update = (theme: AppearanceSettings) => { if (active) setHost(theme === 'light' ? 'light' : 'dark'); };
    void webflow.getTheme().then(theme => { if (!changed) update(theme); }).catch(() => {});
    try { unsubscribe = webflow.subscribe('currenttheme', theme => { changed = true; update(theme); }); } catch { /* Older hosts use the initial or system theme. */ }
    return () => { active = false; unsubscribe?.(); };
  }, [inDesigner]);

  useEffect(() => { applyTheme(appearance); }, [appearance]);
  return { choice, appearance, setChoice: (value: ThemeChoice) => { saveTheme(value); setChoice(value); } };
}
