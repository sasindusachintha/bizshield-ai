(function () {
  const root = document.documentElement;
  const storageKey = 'BizShield-theme';
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
  const initialTheme = urlTheme || storedTheme || (media.matches ? 'dark' : 'light');
  applyTheme(initialTheme, Boolean(storedTheme && !urlTheme));

  function createToggle() {
    if (document.querySelector('.theme-toggle')) return;

    const nav = document.querySelector('.site-header .navbar, nav.navbar');
    if (!nav) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.innerHTML = `
      <i class="fas fa-moon" aria-hidden="true"></i>
      <i class="fas fa-sun" aria-hidden="true"></i>
    `;
    button.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });

    const landingLinks = nav.querySelector('.nav-links');
    const collapsedNav = nav.querySelector('.navbar-collapse');

    if (landingLinks) {
      landingLinks.insertAdjacentElement('afterend', button);
    } else if (collapsedNav) {
      collapsedNav.appendChild(button);
    } else {
      nav.appendChild(button);
    }

    updateToggleLabels();
  }

  document.addEventListener('DOMContentLoaded', createToggle);

  media.addEventListener('change', (event) => {
    if (!readStoredTheme()) {
      applyTheme(event.matches ? 'dark' : 'light', false);
    }
  });

  window.BizShieldTheme = {
    apply: applyTheme,
    current: currentTheme
  };
})();
