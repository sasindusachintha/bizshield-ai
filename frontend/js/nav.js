(function () {
  const navContainer = document.querySelector('.navbar-nav, .nav-links');
  if (!navContainer) return;

  const isInPagesFolder = window.location.pathname.includes('/pages/');
  const pagePrefix = isInPagesFolder ? '' : './pages/';
  const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';

  function createNavLink({ href, icon, label, alignEnd = false, isLogout = false }) {
    const li = document.createElement('li');
    li.className = alignEnd ? 'nav-item ms-auto' : 'nav-item';

    const anchor = document.createElement('a');
    anchor.className = 'nav-link';
    anchor.href = href;
    anchor.innerHTML = `<i class="${icon} me-1"></i>${label}`;

    if (isLogout) {
      anchor.addEventListener('click', (event) => {
        event.preventDefault();
        clearSession();
        window.location.href = `${pagePrefix}login.html`;
      });
    }

    li.appendChild(anchor);
    return li;
  }

  function findAnchor(hrefPath) {
    return navContainer.querySelector(`a[href='${hrefPath}']`) || navContainer.querySelector(`a[href='${pagePrefix}${hrefPath}']`);
  }

  function hideItem(hrefPath) {
    const anchor = findAnchor(hrefPath);
    if (!anchor) return;
    const item = anchor.closest('li');
    if (item) item.classList.add('d-none');
  }

  function showOrCreateItem(config, insertAfterHref) {
    const existingAnchor = findAnchor(config.href);

    if (existingAnchor) {
      const listItem = existingAnchor.closest('li');
      if (listItem) listItem.classList.remove('d-none');
      existingAnchor.innerHTML = `<i class="${config.icon} me-1"></i>${config.label}`;

      if (config.isLogout) {
        if (existingAnchor._logoutHandler) {
          existingAnchor.removeEventListener('click', existingAnchor._logoutHandler);
        }
        const handler = (event) => {
          event.preventDefault();
          clearSession();
          window.location.href = `${pagePrefix}login.html`;
        };
        existingAnchor.addEventListener('click', handler);
        existingAnchor._logoutHandler = handler;
      }

      return;
    }

    const listItem = createNavLink(config);
    if (!insertAfterHref) {
      navContainer.appendChild(listItem);
      return;
    }

    const insertAfterAnchor = findAnchor(insertAfterHref);
    if (insertAfterAnchor && insertAfterAnchor.closest('li')) {
      insertAfterAnchor.closest('li').insertAdjacentElement('afterend', listItem);
      return;
    }

    navContainer.appendChild(listItem);
  }

  function markActive(hrefPath) {
    const anchor = findAnchor(hrefPath);
    if (anchor) {
      anchor.classList.add('active', 'fw-semibold');
    }
  }

  function normalizePageName(page) {
    return page.replace(/\\/g, '/').split('/').pop();
  }

  const TOKEN_KEY = 'bizshieldai-token';
  const LEGACY_TOKEN_KEY = 'token';
  const USER_KEY = 'bizshieldai-user';

  const clearSession = typeof clearAuthSession === 'function'
    ? clearAuthSession
    : () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      };

  function authToken() {
    if (typeof getAuthToken === 'function') {
      return getAuthToken();
    }
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  }

  function isLoggedInLocal() {
    return Boolean(authToken());
  }

  const loginPath = `${pagePrefix}login.html`;
  const registerPath = `${pagePrefix}register.html`;
  const myProjectsPath = `${pagePrefix}my-projects.html`;
  const crisisPath = `${pagePrefix}crisis.html`;

  const settingsPath = `${pagePrefix}settings.html`;

  if (isLoggedInLocal()) {
    showOrCreateItem({ href: myProjectsPath, icon: 'fas fa-folder-open', label: 'My Projects' });
    showOrCreateItem({ href: crisisPath, icon: 'fas fa-triangle-exclamation', label: 'Crisis Mode' });
    showOrCreateItem({ href: settingsPath, icon: 'fas fa-gear', label: 'Settings' });
    hideItem(loginPath);
    hideItem(registerPath);
  } else {
    showOrCreateItem({ href: loginPath, icon: 'fas fa-right-to-bracket', label: 'Login' });
    showOrCreateItem({ href: registerPath, icon: 'fas fa-user-plus', label: 'Register' });
    hideItem(myProjectsPath);
    hideItem(crisisPath);
    hideItem(settingsPath);
    hideItem('#logout');
  }

  // Active-state highlighting for Dashboard / Tools sub-items / Crisis Mode /
  // Login / Register is already baked into each page's static HTML (the
  // correct page has `active fw-semibold` on its own link). My Projects and
  // Crisis Mode are injected at runtime above, so they need it applied here.
  const currentFile = normalizePageName(currentPage);
  if (currentFile === 'my-projects.html') {
    markActive(myProjectsPath);
  } else if (currentFile === 'crisis.html') {
    markActive(crisisPath);
  } else if (currentFile === 'settings.html') {
    markActive(settingsPath);
  }

  // ── Logout Button (positioned at end after all nav items) ──
  if (isLoggedInLocal()) {
    showOrCreateItem({ href: '#logout', icon: 'fas fa-right-from-bracket', label: 'Logout', alignEnd: true, isLogout: true });
  }


})();
