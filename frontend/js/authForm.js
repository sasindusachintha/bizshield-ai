function createAuthForm(config) {
    const root = document.getElementById(config.mountId);
    if (!root) return;

    root.innerHTML = `
        <div class="auth-shell">
            <div class="auth-panel card bg-dark border-secondary">
                <div class="card-body p-4 p-md-5">
                    <div class="mb-4">
                        <span class="auth-kicker">${config.kicker}</span>
                        <h1 class="auth-title">${config.title}</h1>
                        <p class="text-muted mb-0">${config.subtitle}</p>
                    </div>
                    <div id="auth-message"></div>
                    <form id="auth-form" novalidate>
                        ${config.mode === 'register' ? `
                            <div class="mb-3">
                                <label class="form-label fw-semibold" for="name">Name</label>
                                <input id="name" name="name" type="text" class="form-control bg-dark text-light border-secondary" autocomplete="name" required>
                                <div class="invalid-feedback">Enter your name.</div>
                            </div>
                        ` : ''}
                        <div class="mb-3">
                            <label class="form-label fw-semibold" for="email">Email</label>
                            <input id="email" name="email" type="email" class="form-control bg-dark text-light border-secondary" autocomplete="email" required>
                            <div class="invalid-feedback">Enter a valid email address.</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold" for="password">Password</label>
                            <input id="password" name="password" type="password" class="form-control bg-dark text-light border-secondary" autocomplete="${config.mode === 'register' ? 'new-password' : 'current-password'}" minlength="6" required>
                            <div class="invalid-feedback">Password must be at least 6 characters.</div>
                        </div>
                        <button id="auth-submit" type="submit" class="btn btn-primary w-100 mt-2">
                            <i class="${config.icon} me-2"></i>${config.submitLabel}
                        </button>
                    </form>
                    <p class="text-muted small text-center mt-4 mb-0">
                        ${config.switchText}
                        <a class="text-primary fw-semibold" href="${config.switchHref}">${config.switchLabel}</a>
                    </p>
                </div>
            </div>
            <aside class="auth-context">
                <div class="auth-context-inner">
                    <div class="auth-mark-wrap">
                        <i class="fas fa-shield-halved auth-mark"></i>
                    </div>
                    <h2>Secure your growth workspace</h2>
                    <p>Save promising ideas to your account and return to them when you are ready to analyze, plan, and launch.</p>
                    <div class="auth-highlights" aria-label="Account benefits">
                        <div class="auth-highlight">
                            <i class="fas fa-folder-open"></i>
                            <span>Saved projects stay linked to your profile</span>
                        </div>
                        <div class="auth-highlight">
                            <i class="fas fa-chart-line"></i>
                            <span>Ideas, risks, plans, and marketing stay connected</span>
                        </div>
                        <div class="auth-highlight">
                            <i class="fas fa-lock"></i>
                            <span>Your workspace is ready when you return</span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    `;

    const form = document.getElementById('auth-form');
    const message = document.getElementById('auth-message');
    const submit = document.getElementById('auth-submit');
    const defaultLabel = submit.innerHTML;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        message.innerHTML = '';

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const payload = {
            email: form.email.value.trim(),
            password: form.password.value
        };

        if (config.mode === 'register') {
            payload.name = form.name.value.trim();
        }

        submit.disabled = true;
        submit.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${config.loadingLabel}`;

        try {
            await authRequest(config.endpoint, payload);
            message.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>${config.successMessage}
                </div>
            `;
            window.setTimeout(() => {
                window.location.href = config.redirectTo;
            }, 650);
        } catch (error) {
            message.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>${error.message}
                </div>
            `;
        } finally {
            submit.disabled = false;
            submit.innerHTML = defaultLabel;
        }
    });
}
