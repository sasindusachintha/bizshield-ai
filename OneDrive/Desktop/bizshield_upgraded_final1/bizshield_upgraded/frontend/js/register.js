createAuthForm({
    mountId: 'auth-root',
    mode: 'register',
    kicker: 'Create account',
    title: 'Start saving your best ideas',
    subtitle: 'Register once, then keep your strongest opportunities connected to your profile.',
    submitLabel: 'Create Account',
    loadingLabel: 'Creating account...',
    successMessage: 'Account created. Redirecting...',
    icon: 'fas fa-user-plus',
    endpoint: '/register',
    redirectTo: 'dashboard.html',
    switchText: 'Already have an account?',
    switchLabel: 'Log in',
    switchHref: 'login.html'
});
