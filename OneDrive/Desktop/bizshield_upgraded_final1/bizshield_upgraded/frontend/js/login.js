createAuthForm({
    mountId: 'auth-root',
    mode: 'login',
    kicker: 'Welcome back',
    title: 'Log in to BizShield AI',
    subtitle: 'Access your saved ideas and keep your growth workflow moving.',
    submitLabel: 'Log In',
    loadingLabel: 'Logging in...',
    successMessage: 'Login successful. Redirecting...',
    icon: 'fas fa-right-to-bracket',
    endpoint: '/login',
    redirectTo: 'dashboard.html',
    switchText: 'New to BizShield AI?',
    switchLabel: 'Create an account',
    switchHref: 'register.html'
});
