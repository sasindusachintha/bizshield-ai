(function () {
  const root = document.documentElement;
  const storageKey = 'bizshieldai-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function readStoredTheme() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function readUrlTheme() {
    const value = new URLSearchParams(window.location.search).get('theme');
    return value === 'dark' || value === 'light' ? value : null;
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (_) {
      /* Local storage can be unavailable in private or file contexts. */
    }
  }

  function currentTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function updateToggleLabels() {
    const theme = currentTheme();
    const next = theme === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      button.setAttribute('aria-label', `Switch to ${next} mode`);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = `Switch to ${next} mode`;
    });
  }

  function applyTheme(theme, persist = true) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) writeStoredTheme(theme);
    updateToggleLabels();
  }

  const urlTheme = readUrlTheme();
  const storedTheme = readStoredTheme();
  const initialTheme = urlTheme || storedTheme || 'dark';
  applyTheme(initialTheme, Boolean(storedTheme && !urlTheme));

  media.addEventListener('change', (event) => {
    if (!readStoredTheme()) {
      applyTheme(event.matches ? 'dark' : 'light', false);
    }
  });

  window.BizShieldTheme = {
    apply: applyTheme,
    current: currentTheme
  };
  window.ExitoTheme = window.BizShieldTheme;
})();
