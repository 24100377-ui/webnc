const KEY = 'finora-theme';

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(KEY) || 'light';
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
}

export function saveTheme(theme) {
  window.localStorage.setItem(KEY, theme);
  applyTheme(theme);
}
