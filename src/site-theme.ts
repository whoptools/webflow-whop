import { applyTheme, parseTheme, readTheme, resolveTheme, saveTheme, THEME_KEY } from './ui-theme';

const media = matchMedia('(prefers-color-scheme: dark)');
let choice = readTheme();
const update = () => {
  applyTheme(resolveTheme(choice, media.matches));
  document.querySelectorAll<HTMLSelectElement>('[data-ui-theme]').forEach(select => { select.value = choice; });
};
update();
media.addEventListener('change', update);
window.addEventListener('storage', event => { if (event.key === THEME_KEY || event.key === null) { choice = readTheme(); update(); } });
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLSelectElement>('[data-ui-theme]').forEach(select => {
    select.value = choice;
    select.addEventListener('change', () => {
      choice = parseTheme(select.value);
      saveTheme(choice);
      applyTheme(resolveTheme(choice, media.matches));
    });
    select.closest<HTMLElement>('[hidden]')?.removeAttribute('hidden');
  });
});
