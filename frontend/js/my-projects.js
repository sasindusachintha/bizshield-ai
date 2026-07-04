const projectsRoot = document.getElementById('projects-root');
let projectsLoadingTimer = null;

// Friendly labels + icons for every ProjectDocument type, used to render
// the "Available document types" badges on each project card.
const DOCUMENT_TYPE_META = {
  'idea':               { label: 'Idea',               icon: 'fa-lightbulb',       color: 'warning' },
  'market-analysis':    { label: 'Market Analysis',    icon: 'fa-chart-line',      color: 'info' },
  'swot':               { label: 'SWOT',               icon: 'fa-grip',            color: 'primary' },
  'marketing-plan':     { label: 'Marketing Plan',     icon: 'fa-bullhorn',        color: 'danger' },
  'business-model':     { label: 'Business Plan',      icon: 'fa-route',           color: 'success' },
  'financial-forecast': { label: 'Financial Forecast', icon: 'fa-coins',           color: 'secondary' },
  'risk-assessment':    { label: 'Risk Assessment',    icon: 'fa-triangle-exclamation', color: 'dark' },
  'pitch-deck':         { label: 'Pitch Deck',         icon: 'fa-display',         color: 'info' }
};

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderProjectsLoading() {
  if (!projectsRoot) return;
  projectsRoot.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-warning mb-3" style="width:3rem;height:3rem" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted">Loading your projects…</p>
    </div>
  `;

  clearTimeout(projectsLoadingTimer);
  projectsLoadingTimer = setTimeout(() => {
    if (!projectsRoot) return;
    projectsRoot.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-clock me-2"></i>
        Still loading your projects. If this continues, check your connection or try again.
      </div>
    `;
  }, 3000);
}

function renderProjectsEmpty() {
  if (!projectsRoot) return;
  projectsRoot.innerHTML = `
    <div class="card bg-dark border-secondary py-5 px-4 text-center">
      <div class="mb-3">
        <i class="fas fa-folder-open text-warning fa-2x"></i>
      </div>
      <h3 class="fw-bold mb-2">No projects yet</h3>
      <p class="text-muted mb-3">Save an idea from Growth Mode, or create a new project to start a workspace.</p>
      <div class="d-flex justify-content-center gap-2">
        <a href="ideas.html" class="btn btn-outline-warning btn-sm">Generate new ideas</a>
        <button type="button" class="btn btn-outline-success btn-sm" onclick="document.getElementById('btn-new-project').click()">
          <i class="fas fa-plus me-1"></i>New Project
        </button>
      </div>
    </div>
  `;
}

function renderProjectsError(message) {
  if (!projectsRoot) return;
  projectsRoot.innerHTML = `
    <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
      <i class="fas fa-exclamation-circle"></i>
      <span><strong>Error:</strong> ${escapeHTML(message)}</span>
    </div>
  `;
}

function renderDocumentTypeBadges(documentTypes) {
  const types = Array.isArray(documentTypes) ? documentTypes : [];

  if (!types.length) {
    return '<span class="badge bg-secondary"><i class="fas fa-circle-info me-1"></i>No documents yet</span>';
  }

  return types
    .map((type) => {
      const meta = DOCUMENT_TYPE_META[type] || { label: type, icon: 'fa-file', color: 'secondary' };
      return `<span class="badge bg-${meta.color}"><i class="fas ${meta.icon} me-1"></i>${escapeHTML(meta.label)}</span>`;
    })
    .join(' ');
}

function renderProjectCard(project) {
  const created = formatDate(project.createdAt);
  const industry = project.industry ? escapeHTML(project.industry) : 'Industry not set';
  const stage = project.stage ? escapeHTML(project.stage) : 'ideation';

  return `
    <div class="col-12 col-lg-6">
      <div class="card bg-dark border-secondary h-100 shadow-sm" data-project-id="${escapeHTML(project._id)}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="fw-bold mb-1">${escapeHTML(project.title || 'Untitled project')}</h5>
              <small class="text-muted">
                <i class="fas fa-industry me-1"></i>${industry}
                &nbsp;&middot;&nbsp;
                <i class="fas fa-calendar me-1"></i>Created ${escapeHTML(created)}
              </small>
            </div>
            <span class="badge bg-primary text-capitalize">${stage}</span>
          </div>

          ${project.description ? `<p class="text-muted small mb-3">${escapeHTML(project.description)}</p>` : ''}

          <div class="mb-3">
            <div class="text-muted small mb-1">Available documents</div>
            <div class="d-flex flex-wrap gap-1">${renderDocumentTypeBadges(project.documentTypes)}</div>
          </div>

          <div class="mt-auto d-flex justify-content-between align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline-danger js-delete-project">
              <i class="fas fa-trash me-1"></i>Delete
            </button>
            <a href="project.html?id=${encodeURIComponent(project._id)}" class="btn btn-sm btn-outline-primary">
              <i class="fas fa-folder-open me-1"></i>Open Project
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProjectsList(projects) {
  if (!projectsRoot) return;
  if (!Array.isArray(projects) || projects.length === 0) {
    renderProjectsEmpty();
    return;
  }

  projectsRoot.innerHTML = `
    <div class="row g-4">
      ${projects.map((project) => renderProjectCard(project)).join('')}
    </div>
  `;
}

async function loadUserProjects() {
  try {
    renderProjectsLoading();
    const response = await getUserProjects();
    const projects = Array.isArray(response.projects) ? response.projects : [];
    clearTimeout(projectsLoadingTimer);
    renderProjectsList(projects);
  } catch (error) {
    clearTimeout(projectsLoadingTimer);
    renderProjectsError(error.message || 'Failed to load projects.');
  }
}

// ── Delete project ──────────────────────────────────────
if (projectsRoot) {
  projectsRoot.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('.js-delete-project');
    if (!deleteButton) return;

    const card = deleteButton.closest('[data-project-id]');
    const projectId = card?.dataset.projectId;
    if (!projectId) return;

    const projectTitle = card.querySelector('h5')?.textContent || 'this project';
    const confirmed = window.confirm(`Delete "${projectTitle}"? This removes all of its saved documents and cannot be undone.`);
    if (!confirmed) return;

    deleteButton.disabled = true;
    deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting';

    try {
      await deleteProject(projectId);
      card.closest('.col-12')?.remove();
      if (!projectsRoot.querySelector('[data-project-id]')) {
        renderProjectsEmpty();
      }
    } catch (error) {
      deleteButton.disabled = false;
      deleteButton.innerHTML = '<i class="fas fa-trash me-1"></i>Delete';
      window.alert(error.message || 'Failed to delete project.');
    }
  });
}

// ── New Project modal ───────────────────────────────────
const newProjectModalEl = document.getElementById('newProjectModal');
const newProjectModal = newProjectModalEl && window.bootstrap
  ? new bootstrap.Modal(newProjectModalEl)
  : null;

const btnNewProject = document.getElementById('btn-new-project');
const btnCreateProject = document.getElementById('btn-create-project');
const newProjectError = document.getElementById('new-project-error');

if (btnNewProject && newProjectModal) {
  btnNewProject.addEventListener('click', () => {
    if (newProjectError) {
      newProjectError.classList.add('d-none');
      newProjectError.textContent = '';
    }
    newProjectModal.show();
  });
}

if (btnCreateProject) {
  btnCreateProject.addEventListener('click', async () => {
    const title = document.getElementById('new-project-title')?.value.trim();
    const industry = document.getElementById('new-project-industry')?.value.trim();
    const stage = document.getElementById('new-project-stage')?.value;
    const description = document.getElementById('new-project-description')?.value.trim();

    if (!title) {
      if (newProjectError) {
        newProjectError.textContent = 'Project title is required.';
        newProjectError.classList.remove('d-none');
      }
      return;
    }

    btnCreateProject.disabled = true;
    btnCreateProject.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';

    try {
      await createProject({ title, industry, stage, description });
      newProjectModal?.hide();

      // Reset the form for next time
      document.getElementById('new-project-title').value = '';
      document.getElementById('new-project-industry').value = '';
      document.getElementById('new-project-description').value = '';
      document.getElementById('new-project-stage').value = 'ideation';

      await loadUserProjects();
    } catch (error) {
      if (newProjectError) {
        newProjectError.textContent = error.message || 'Failed to create project.';
        newProjectError.classList.remove('d-none');
      }
    } finally {
      btnCreateProject.disabled = false;
      btnCreateProject.innerHTML = '<i class="fas fa-check me-1"></i>Create Project';
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (!projectsRoot) return;
  const token = localStorage.getItem('bizshieldai-token') || localStorage.getItem('token');
  if (!token) {
    localStorage.removeItem('bizshieldai-user');
    window.location.href = 'login.html';
    return;
  }
  loadUserProjects();
});
