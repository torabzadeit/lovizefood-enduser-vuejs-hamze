/** mode: 0 = رمضان، 1 = عادی */
export function applyAppModeTheme(mode) {
  if (typeof document === 'undefined') return;
  const isRamadan = Number(mode) === 0;
  const theme = isRamadan ? 'ramadan' : 'normal';
  document.documentElement.setAttribute('data-laviz-mode', theme);
  const root = document.querySelector('.laviz-app');
  if (root) {
    root.classList.toggle('laviz-app--ramadan', isRamadan);
    root.classList.toggle('laviz-app--normal', !isRamadan);
  }
}
