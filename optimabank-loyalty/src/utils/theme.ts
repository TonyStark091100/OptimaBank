// Simple theme manager: Light/Dark/Auto with system preference
export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_KEY = 'app_theme_mode';

const applyClass = (mode: 'light' | 'dark') => {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(mode === 'dark' ? 'theme-dark' : 'theme-light');
};

export const applyTheme = (mode: ThemeMode) => {
  if (mode === 'auto') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyClass(prefersDark ? 'dark' : 'light');
  } else {
    applyClass(mode);
  }
  try { localStorage.setItem(THEME_KEY, mode); } catch {}
};

export const initTheme = () => {
  let stored: ThemeMode = 'auto';
  try {
    const v = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (v === 'light' || v === 'dark' || v === 'auto') stored = v;
  } catch {}
  applyTheme(stored);

  if (stored === 'auto' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('auto');
    try { mq.addEventListener('change', listener); } catch { mq.addListener(listener); }
  }
};
