/**
 * PROJECT SAVE HELPER
 *
 * Shared by analysis.js, plan.js, and marketing.js. Lets the user pick
 * which Project a freshly generated AI output should be attached to (or
 * create a brand-new project on the fly), then saves it as a
 * ProjectDocument of the given type.
 *
 * A project can hold many documents of the same type, so saving never
 * overwrites a prior generation — every save adds to that project's
 * history.
 */

function psEscapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Shows a small modal letting the user choose an existing project or
 * create a new one. Resolves with the chosen project's id, or null if
 * the user cancelled.
 */
function pickProjectId(projects) {
    return new Promise((resolve) => {
        const modalId = 'project-picker-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const options = (projects || [])
            .map((p) => `<option value="${psEscapeHTML(p._id)}">${psEscapeHTML(p.title)}${p.industry ? ` — ${psEscapeHTML(p.industry)}` : ''}</option>`)
            .join('');

        const html = `
          <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content bg-dark border-secondary">
                <div class="modal-header border-secondary">
                  <h5 class="modal-title fw-bold"><i class="fas fa-folder-open text-warning me-2"></i>Save to Project</h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  ${(projects || []).length ? `
                    <label class="form-label fw-semibold">Choose an existing project</label>
                    <select id="project-picker-select" class="form-select bg-dark text-light border-secondary mb-3">
                      ${options}
                    </select>
                    <div class="text-center text-muted small mb-2">— or create a new project —</div>
                  ` : `
                    <p class="text-muted small mb-3">You don't have any projects yet. Create one to save this content.</p>
                  `}
                  <label class="form-label fw-semibold">New project title</label>
                  <input type="text" id="project-picker-new-title" class="form-control bg-dark text-light border-secondary" maxlength="140" placeholder="e.g. EcoPack Subscription Boxes">
                  <div id="project-picker-error" class="text-danger small mt-2 d-none"></div>
                </div>
                <div class="modal-footer border-secondary">
                  <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" id="project-picker-confirm" class="btn btn-success">
                    <i class="fas fa-check me-1"></i>Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        const modalEl = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalEl);
        const errorEl = modalEl.querySelector('#project-picker-error');

        let resolved = false;

        modalEl.querySelector('#project-picker-confirm').addEventListener('click', async () => {
            const newTitle = modalEl.querySelector('#project-picker-new-title')?.value.trim();
            const select = modalEl.querySelector('#project-picker-select');

            if (newTitle) {
                try {
                    const created = await createProject({ title: newTitle });
                    resolved = true;
                    modal.hide();
                    resolve(created.project._id);
                } catch (error) {
                    if (errorEl) {
                        errorEl.textContent = error.message || 'Failed to create project.';
                        errorEl.classList.remove('d-none');
                    }
                }
                return;
            }

            if (select && select.value) {
                resolved = true;
                modal.hide();
                resolve(select.value);
                return;
            }

            if (errorEl) {
                errorEl.textContent = 'Choose an existing project or enter a title for a new one.';
                errorEl.classList.remove('d-none');
            }
        });

        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl.remove();
            if (!resolved) resolve(null);
        });

        modal.show();
    });
}

/**
 * Prompts the user to choose a project, then saves the given content as a
 * ProjectDocument of `type` under that project.
 *
 * @param {Object} params
 * @param {string} params.type    - one of ProjectDocument's DOCUMENT_TYPES
 * @param {string} params.title   - display title for the saved document
 * @param {*}      params.content - the AI-generated content to store
 * @returns {Promise<{project, document}>}
 * @throws if the user cancels, or the save fails
 */
async function promptAndSaveToProject({ type, title, content }) {
    const response = await getUserProjects();
    const projects = Array.isArray(response.projects) ? response.projects : [];

    const projectId = await pickProjectId(projects);
    if (!projectId) {
        throw new Error('Save cancelled.');
    }

    return saveProjectDocument(projectId, { type, title, content });
}
