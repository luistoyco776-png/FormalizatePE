import { DATA } from "./data/appData.js";
import { state, resetState } from "./state/appState.js";
import { signIn, signUp, signOut, getCurrentSession } from "./services/authService.js";
import { getProfile, updateProfile } from "./services/profileService.js";
import { loadProgress, saveStageProgress } from "./services/progressService.js";
import { listDocuments, uploadDocument } from "./services/documentService.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function icon(name, className = "") {
  return `<i data-lucide="${name}"${className ? ` class="${className}"` : ""} aria-hidden="true"></i>`;
}
function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
function getStage(id) { return DATA.stages.find(stage => stage.id === id); }
function statusBadge(status) {
  const [style, glyph] = DATA.statusStyles[status] || DATA.statusStyles["no-iniciado"];
  return `<span class="status-badge ${style}">${icon(glyph)}${DATA.statusLabels[status] || "No iniciado"}</span>`;
}
function recommend(answers) {
  const score = (answers.socios === "si" ? 2 : 0) + (answers.patrimonio === "si" ? 2 : 0) + (answers.capital === "si" ? 1 : 0);
  return score >= 2 ? "sac" : "ruc10";
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.add("hidden"), 3400);
}
function visibleStages() {
  return DATA.stages.filter(stage => state.figure !== "ruc10" || stage.appliesToRuc10);
}

/* Login simulado */
async function enterApp(mode = "guest", user = null) {
  resetState(mode, user);
  if (mode === "account" && user) await hydrateAccount(user);
  $("#login-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  renderNav();
  renderProgressTab();
  renderVault();
  renderGuides();
  updateIdentity();
  refreshIcons();
  window.scrollTo({ top: 0, behavior: "instant" });
}
async function hydrateAccount(user) {
  const profile = await getProfile(user.id);
  state.profile = profile || { nombre_mype: "Mi emprendimiento", legal_figure: null, diagnostic_answers: {} };
  state.figure = state.profile.legal_figure || null;
  state.answers = state.profile.diagnostic_answers || {};
  const progress = await loadProgress(user.id);
  state.statuses = progress.statuses;
  state.checklist = progress.checklist;
  state.documents = await listDocuments(user.id);
}
function updateIdentity() {
  const name = state.mode === "account" ? (state.user?.email || "Usuario") : "Invitado demo";
  const business = state.profile?.nombre_mype || "Mi Bodega Pro";
  $("#header-business").textContent = business;
  $("#session-chip").innerHTML = `<span class="demo-dot"></span> ${state.mode === "account" ? "Cuenta personal" : "Invitado demo"}`;
  $("#user-avatar").textContent = state.mode === "account" ? name.slice(0,2).toUpperCase() : "IN";
  const project = $("#header-business"); if (project) project.title = business;
}
async function logout() {
  try { if (state.mode === "account") await signOut(); } catch (error) { showToast(error.message); return; }
  resetState("guest");
  closeModal(false);
  $("#app-shell").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
  $("#login-form").reset();
  $("#login-feedback").textContent = "";
  $("#sidebar").classList.remove("mobile-open");
  state.mobileMenuOpen = false;
  window.scrollTo({ top: 0, behavior: "instant" });
  refreshIcons();
}

/* Navegación por pestañas */
function renderNav() {
  const build = (mobile = false) => DATA.navItems.map(item => {
    const active = item.id === state.activeTab;
    return `<li><button type="button" data-tab="${item.id}" class="nav-button ${active ? "active" : ""}" ${active ? 'aria-current="page"' : ""}>
      ${icon(item.icon)}<span>${mobile ? item.shortLabel : item.label}</span></button></li>`;
  }).join("");
  $("#sidebar-nav").innerHTML = build(false);
  $("#mobile-nav").innerHTML = build(true);
  refreshIcons();
}
function setTab(tab) {
  if (!DATA.navItems.some(item => item.id === tab)) return;
  state.activeTab = tab;
  $$("[data-tab-panel]").forEach(panel => panel.classList.toggle("hidden", panel.dataset.tabPanel !== tab));
  renderNav();
  if (tab === "progreso") renderProgressTab();
  if (tab === "boveda") renderVault();
  if (tab === "guias") renderGuides();
  $("#sidebar").classList.remove("mobile-open");
  state.mobileMenuOpen = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Perfilamiento inicial */
function renderWizard() {
  const answered = Object.keys(state.answers).filter(key => state.answers[key]).length;
  const complete = answered === DATA.questions.length;
  const figure = complete ? recommend(state.answers) : null;
  const questionsHtml = DATA.questions.map((question, index) => {
    const options = [{ value: "si", label: question.yes }, { value: "no", label: question.no }];
    return `<article class="question-card"><div class="question-top"><span class="question-number">${index + 1}</span><div>
      <h3>${question.question}</h3><p>${question.help}</p></div></div>
      <div class="answer-options">${options.map(option => `<label class="answer-option"><input type="radio" name="${question.id}" value="${option.value}" ${state.answers[question.id] === option.value ? "checked" : ""}>${option.label}</label>`).join("")}</div>
    </article>`;
  }).join("");

  let recommendationHtml = `<div class="empty-recommend">${icon("route")}<strong>Tu orientación aparecerá aquí</strong><p>Responde las tres preguntas para recibir una orientación inicial sobre la figura legal.</p></div>`;
  if (figure) {
    const info = DATA.legalFigures[figure];
    recommendationHtml = `<div class="recommend-card" aria-live="polite"><span class="recommend-label">Orientación inicial</span>
      <h3>${info.title}</h3><p>${info.summary}</p><ul>${info.highlights.map(item => `<li>${icon("check-circle-2")}${item}</li>`).join("")}</ul>
      <button type="button" class="btn-solid w-full" id="start-btn" data-figure="${figure}" style="margin-top:20px">Ver mi ruta ${icon("arrow-right")}</button>
      <p style="font-size:.68rem;margin-top:10px">Esta sugerencia es orientativa, no una determinación legal o tributaria.</p></div>`;
  }

  $("#wizard").innerHTML = `<div class="page-heading"><span class="page-kicker">Empecemos por tu situación</span><h2>Encuentra una ruta de formalización orientativa</h2>
    <p>Responde unas preguntas para organizar los siguientes pasos. Podrás revisar las etapas y registrar tu avance.</p></div>
    <div class="hero-strip"><div><h3>Plataforma de Formalización Empresarial del Perú</h3><p>Orientación paso a paso con referencias de Gob.pe, PRODUCE, SUNARP y SUNAT. Los requisitos pueden variar según el negocio, la ubicación y la normativa vigente.</p></div><div class="hero-icon">${icon("compass")}</div></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5"><div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 class="section-title">Diagnóstico inicial</h3><span class="muted-copy">${answered} de ${DATA.questions.length}</span></div><div class="question-list">${questionsHtml}</div></div>
    <div><h3 class="section-title" style="margin-bottom:12px">Resultado del diagnóstico</h3>${recommendationHtml}</div></div>`;
  refreshIcons();
}
function renderProgressTab() {
  const hasFigure = state.figure !== null;
  $("#wizard").classList.toggle("hidden", hasFigure);
  $("#board").classList.toggle("hidden", !hasFigure);
  $("#header-business").textContent = "Mi Bodega Pro";
  if (hasFigure) renderBoard();
  else renderWizard();
}

/* Tarjetas de etapas */
function renderBoard() {
  const stages = visibleStages();
  const completed = stages.filter(stage => state.statuses[stage.id] === "completado").length;
  const percent = stages.length ? Math.round(completed / stages.length * 100) : 0;
  const cards = stages.map(stage => {
    const status = state.statuses[stage.id];
    return `<li><button type="button" class="stage-card w-full" data-open-stage="${stage.id}" aria-label="Abrir etapa ${stage.title}">
      <div class="stage-card-top"><span class="stage-number">${stage.step.toString().padStart(2, "0")}</span>${statusBadge(status)}</div>
      <h3>${stage.title}</h3><div class="stage-entity">${icon("landmark")}${stage.entity}</div>
      <div class="stage-card-footer"><span>Costo estimado</span><strong>${stage.cost}</strong></div>
      <div class="stage-status-caption">Ver requisitos y registrar avance ${icon("arrow-up-right")}</div>
    </button></li>`;
  }).join("");
  $("#board").innerHTML = `<div class="page-heading"><span class="page-kicker">Tu ruta personalizada</span><h2>Mi progreso</h2>
    <p>Abre una etapa para revisar sus requisitos, adjuntar evidencia y actualizar el estado de tu seguimiento.</p></div>
    <div class="hero-strip"><div><h3>${DATA.legalFigures[state.figure].title}</h3><p>Las etapas se muestran como orientación. Confirma los requisitos y las condiciones vigentes con la entidad responsable.</p></div><div class="hero-icon">${icon("route")}</div></div>
    <div class="panel-card progress-summary"><div><div class="percent tabular-nums">${percent}%</div><div class="percent-label">${completed} de ${stages.length} etapas completadas</div></div><div class="progress-track" role="progressbar" aria-label="Progreso de formalización" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="progress-fill" style="width:${percent}%"></div></div>
      <button id="restart-btn" type="button" class="btn-outline">${icon("rotate-ccw")}Rehacer diagnóstico</button></div>
    <div class="list-header"><div><h3 class="section-title">Etapas de tu proceso</h3><p class="muted-copy" style="margin-top:5px">Selecciona una tarjeta para abrir el asistente guiado.</p></div><span class="muted-copy">${stages.length} etapas en esta ruta</span></div>
    <ol class="stage-grid">${cards}</ol>
    ${state.figure === "ruc10" ? `<p class="optional-note">En esta ruta demostrativa se omiten las etapas de constitución de persona jurídica. La aplicación real deberá verificar otras obligaciones que puedan corresponder a tu actividad y ubicación.</p>` : ""}`;
  refreshIcons();
}

/* Modal guiado: 1 requisitos, 2 expediente, 3 resumen */
function renderModal() {
  const stage = getStage(state.openStageId);
  if (!stage) return;
  const checked = state.checklist[stage.id] || [];
  const docs = state.documents.filter(doc => doc.stageId === stage.id);
  const omitted = stage.requirements.length - checked.length;
  const phase = state.modalPhase;

  const stepper = [
    ["1", "Requisitos"], ["2", "Expediente"], ["3", "Resumen"]
  ].map(([number, label], index) => {
    const n = index + 1;
    const cls = n === phase ? "active" : (n < phase ? "done" : "");
    return `${index ? '<span class="stepper-line"></span>' : ""}<button type="button" class="stepper-step ${cls}" data-phase="${n}" aria-current="${n === phase ? "step" : "false"}"><span class="stepper-circle">${n < phase ? icon("check") : number}</span><span>${label}</span></button>`;
  }).join("");

  const requirements = stage.requirements.map((requirement, index) => `<li><label class="checklist-item">
    <input type="checkbox" data-req-index="${index}" ${checked.includes(index) ? "checked" : ""}>
    <span>${escapeHtml(requirement)}</span></label></li>`).join("");

  const docsHtml = docs.length ? `<ul class="uploaded-list">${docs.map(doc => `<li class="uploaded-item">${icon("file-text")}<span title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span><small>${doc.sizeKb} KB</small></li>`).join("")}</ul>` : `<p class="muted-copy" style="margin-top:12px">Todavía no se han adjuntado archivos a esta etapa.</p>`;

  let content = "";
  if (phase === 1) {
    content = `<h3 class="phase-title">Verificación de requisitos</h3>
      <p class="phase-description">Marque las condiciones con las que cuenta actualmente antes de iniciar el trámite presencial o virtual. Este checklist es una ayuda de organización y debe contrastarse con la lista oficial de la entidad.</p>
      <div class="check-count">${checked.length} de ${stage.requirements.length} requisitos marcados</div><ul class="checklist">${requirements}</ul>`;
  } else if (phase === 2) {
    content = `<h3 class="phase-title">Expediente digital</h3>
      <p class="phase-description">Adjunta la evidencia digital de tu trámite para mantenerla organizada en el expediente de tu empresa.</p>
      <div class="upload-note">${icon("info")} ${state.mode === "account" ? "Los archivos se guardan de forma privada en tu espacio de Supabase." : "En modo invitado, los archivos solo se conservan durante esta sesión del navegador."}</div>
      <label class="dropzone" id="dropzone"><span class="dropzone-icon">${icon("cloud-upload")}</span><strong>${escapeHtml(stage.uploadHint)}</strong><small>Arrastra y suelta o haz clic · PDF, JPG o PNG · Máximo 10 MB por archivo</small><input id="file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" class="sr-only"></label>
      ${docsHtml}`;
  } else {
    const alert = omitted > 0
      ? `<div class="warning-box">${icon("alert-triangle")}<span><strong>Atención: Ha omitido ${omitted} ${omitted === 1 ? "requisito" : "requisitos"}.</strong> Le recomendamos revisarlos para reducir el riesgo de observaciones. El checklist no confirma por sí solo que un expediente esté completo.</span></div>`
      : `<div class="success-box">${icon("check-circle-2")}<span>Has marcado todos los requisitos de esta etapa. Verifica igualmente la lista oficial antes de presentar documentos.</span></div>`;
    const statusOptions = ["no-iniciado", "en-proceso", "completado"].map(value => `<option value="${value}" ${state.statuses[stage.id] === value ? "selected" : ""}>${DATA.statusLabels[value]}</option>`).join("");
    content = `${alert}<h3 class="phase-title">Resumen de la etapa</h3><p class="phase-description">Revisa el checklist, la evidencia adjunta y el estado que deseas registrar.</p>
      <div class="grid grid-cols-2 gap-3" style="margin-bottom:18px"><div class="panel-card" style="padding:14px"><span class="muted-copy">Requisitos marcados</span><strong style="display:block;font-size:1.25rem;margin-top:5px">${checked.length}/${stage.requirements.length}</strong></div><div class="panel-card" style="padding:14px"><span class="muted-copy">Archivos adjuntos</span><strong style="display:block;font-size:1.25rem;margin-top:5px">${docs.length}</strong></div></div>
      <div class="status-field"><label for="status-select">Estado de seguimiento</label><select id="status-select">${statusOptions}</select></div>
      <p class="muted-copy" style="margin-top:12px">El estado lo actualiza manualmente el usuario; no representa una verificación automática del estado del trámite ante la entidad.</p>`;
  }

  $("#modal-body").innerHTML = `<div class="modal-head"><div class="modal-eyebrow">Etapa ${stage.step} · ${escapeHtml(stage.entity)}</div><h2 id="modal-title">${escapeHtml(stage.title)}</h2><p id="modal-description">${escapeHtml(stage.description)}</p>
    <div class="modal-meta"><span>${icon("wallet")}Costo: <strong>${escapeHtml(stage.cost)}</strong></span><span>${icon("clock-3")}Plazo: <strong>${escapeHtml(stage.duration)}</strong></span>${statusBadge(state.statuses[stage.id])}</div></div>
    <div class="stepper" aria-label="Pasos del asistente">${stepper}</div>
    <div class="modal-content">${content}</div>
    <div class="modal-footer"><button type="button" class="btn-outline" data-modal-back ${phase === 1 ? "disabled" : ""}>${icon("arrow-left")}Atrás</button>
      <div class="modal-footer-right">${phase < 3 ? `<button type="button" class="btn-solid" data-modal-next>Siguiente ${icon("arrow-right")}</button>` : `<button type="button" class="btn-solid" id="save-stage-btn">${icon("check")}Guardar y finalizar etapa</button>`}</div></div>
    <div class="modal-links">${stage.links.map(link => `<a href="${link.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.entity)} · ${escapeHtml(link.label)}${icon("external-link")}</a>`).join("")}</div>`;
  refreshIcons();
}
function openModal(stageId) {
  if (!getStage(stageId)) return;
  state.openStageId = stageId;
  state.modalPhase = 1;
  state.lastFocused = document.activeElement;
  renderModal();
  $("#stage-modal").classList.remove("hidden");
  document.body.classList.add("modal-open");
  $("#stage-modal .modal-close").focus();
}
function closeModal(restoreFocus = true) {
  state.openStageId = null;
  $("#stage-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  if (restoreFocus && state.lastFocused && typeof state.lastFocused.focus === "function") state.lastFocused.focus();
}
function changePhase(phase) {
  if (!state.openStageId || phase < 1 || phase > 3) return;
  state.modalPhase = phase;
  renderModal();
  const stepButton = $(`#modal-body [data-phase="${phase}"]`);
  if (stepButton) stepButton.focus();
}
async function handleUpload(fileList) {
  const stageId = state.openStageId;
  if (!stageId || !fileList || !fileList.length) return;
  const accepted = [], rejected = [];
  for (const file of Array.from(fileList)) {
    const extOk = /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!extOk || file.size > 10 * 1024 * 1024) { rejected.push(file.name); continue; }
    try {
      let doc;
      if (state.mode === "account") doc = await uploadDocument(state.user.id, stageId, file);
      else doc = { id: `demo-${Date.now()}-${Math.random()}`, name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), stageId, uploadedAt: new Date().toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }), url: URL.createObjectURL(file), demoUpload: true };
      accepted.push(doc);
    } catch (error) { rejected.push(`${file.name} (${error.message})`); }
  }
  if (accepted.length) {
    state.documents = [...accepted, ...state.documents];
    if (state.statuses[stageId] === "no-iniciado" || state.statuses[stageId] === "pendiente") state.statuses[stageId] = "en-proceso";
    showToast(`${accepted.length} archivo(s) agregado(s) al expediente.`);
  }
  if (rejected.length) showToast(`No se agregaron algunos archivos. Revisa formato, tamaño o permisos.`);
  renderModal(); renderBoard();
}

/* Bóveda de documentos */
function renderVault() {
  const totalKb = state.documents.reduce((sum, doc) => sum + doc.sizeKb, 0);
  const groups = DATA.stages.map(stage => {
    const docs = state.documents.filter(doc => doc.stageId === stage.id);
    const rows = docs.length ? docs.map(doc => `<li class="document-row"><span class="file-icon">${icon("file-text")}</span>
      <div class="document-main"><strong title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</strong><span>${doc.sizeKb} KB · ${escapeHtml(doc.uploadedAt)}</span></div>
      ${doc.url ? `<a class="document-action" href="${doc.url}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${escapeHtml(doc.name)}">${icon("external-link")}</a>` : `<span class="document-action" title="Documento de ejemplo">${icon("file-lock-2")}</span>`}</li>`).join("")
      : `<p class="muted-copy" style="padding:15px 17px;margin:0">Aún no hay archivos adjuntos en esta etapa.</p>`;
    return `<article class="panel-card vault-card"><div class="vault-head"><strong>${stage.step.toString().padStart(2, "0")} · ${stage.title}</strong><span>${docs.length} ${docs.length === 1 ? "archivo" : "archivos"}</span></div><ul style="list-style:none;padding:0;margin:0">${rows}</ul></article>`;
  }).join("");
  $("#tab-boveda").innerHTML = `<div class="page-heading"><span class="page-kicker">Expediente digital</span><h2>Bóveda de documentos</h2><p>Consulta los archivos asociados a las distintas etapas de tu ruta.</p></div>
    <div class="notice">${icon("shield-check")}<span><strong>${state.mode === "account" ? "Expediente privado:" : "Privacidad en modo demo:"}</strong> ${state.mode === "account" ? "Los archivos de esta cuenta se almacenan en un bucket privado y solo el titular puede consultarlos." : "Los archivos cargados se conservan solo durante esta sesión del navegador."} Hay ${state.documents.length} archivos en el listado (${totalKb.toLocaleString("es-PE")} KB).</span></div>
    <div class="vault-grid">${groups}</div>`;
  refreshIcons();
}
function renderGuides() {
  const items = DATA.officialGuides.map(guide => `<li><a class="panel-card guide-card" href="${guide.href}" target="_blank" rel="noopener noreferrer"><span class="guide-icon">${icon("landmark")}</span><span class="guide-copy"><small>${escapeHtml(guide.entity)}</small><strong>${escapeHtml(guide.label)}</strong><span>${escapeHtml(guide.description)}</span></span>${icon("external-link")}</a></li>`).join("");
  $("#tab-guias").innerHTML = `<div class="page-heading"><span class="page-kicker">Fuentes de consulta</span><h2>Guías oficiales</h2><p>Accesos a portales públicos para verificar información antes de iniciar cada trámite.</p></div>
    <div class="notice">${icon("info")}<span>Los enlaces conducen a sitios externos. Las tasas, plazos y requisitos pueden cambiar; verifica siempre la información publicada por la entidad competente.</span></div>
    <ul class="guide-list" style="list-style:none;padding:0;margin:0">${items}</ul>`;
  refreshIcons();
}

/* Eventos: delegación para mantener los botones funcionales tras volver a renderizar */
function bindEvents() {
  $("#guest-btn").addEventListener("click", () => enterApp("guest"));
  $("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    const email = $("#email").value.trim(); const password = $("#password").value;
    $("#login-feedback").textContent = "Verificando acceso...";
    try { const result = await signIn(email, password); await enterApp("account", result.user); }
    catch (error) { $("#login-feedback").textContent = authMessage(error); }
  });
  $("#register-btn").addEventListener("click", async () => {
    const email = $("#email").value.trim(); const password = $("#password").value;
    if (!email || password.length < 6) { $("#login-feedback").textContent = "Escribe tu correo y una contraseña de al menos 6 caracteres."; return; }
    $("#login-feedback").textContent = "Creando cuenta...";
    try { const result = await signUp(email, password);
      if (result.session) await enterApp("account", result.user);
      else $("#login-feedback").textContent = "Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.";
    } catch (error) { $("#login-feedback").textContent = authMessage(error); }
  });
  $("#logout-btn").addEventListener("click", logout);
  $("#mobile-menu-btn").addEventListener("click", () => {
    state.mobileMenuOpen = !state.mobileMenuOpen;
    $("#sidebar").classList.toggle("mobile-open", state.mobileMenuOpen);
  });

  document.addEventListener("click", async event => {
    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) { setTab(tabButton.dataset.tab); return; }

    const stageButton = event.target.closest("[data-open-stage]");
    if (stageButton) { openModal(stageButton.dataset.openStage); return; }

    if (event.target.closest("[data-close-modal]")) { closeModal(); return; }

    const phaseButton = event.target.closest("[data-phase]");
    if (phaseButton) { changePhase(Number(phaseButton.dataset.phase)); return; }

    if (event.target.closest("[data-modal-next]")) { changePhase(Math.min(3, state.modalPhase + 1)); return; }
    if (event.target.closest("[data-modal-back]")) { changePhase(Math.max(1, state.modalPhase - 1)); return; }

    const startButton = event.target.closest("#start-btn");
    if (startButton) {
      state.figure = startButton.dataset.figure;
      if (state.mode === "account") updateProfile(state.user.id, { legal_figure: state.figure, diagnostic_answers: state.answers }).catch(error => showToast(error.message));
      renderProgressTab();
      return;
    }
    if (event.target.closest("#restart-btn")) {
      state.figure = null;
      state.answers = {};
      if (state.mode === "account") updateProfile(state.user.id, { legal_figure: null, diagnostic_answers: {} }).catch(error => showToast(error.message));
      renderProgressTab();
      return;
    }
    if (event.target.closest("#save-stage-btn")) {
      const stageId = state.openStageId;
      const select = $("#status-select");
      if (stageId && select) state.statuses[stageId] = select.value;
      const checked = state.checklist[stageId] || [];
      if (state.mode === "account") {
        try { await saveStageProgress(state.user.id, stageId, state.statuses[stageId], checked); }
        catch (error) { showToast(`No se pudo guardar: ${error.message}`); return; }
        showToast("Etapa y requisitos guardados en tu cuenta.");
      } else showToast("Cambios guardados en esta sesión de demostración.");
      renderBoard(); renderVault(); closeModal();
    }
  });

  $("#wizard").addEventListener("change", event => {
    if (event.target.type !== "radio") return;
    state.answers[event.target.name] = event.target.value;
    renderWizard();
    const selected = $(`#wizard input[name="${event.target.name}"][value="${event.target.value}"]`);
    if (selected) selected.focus();
  });

  $("#modal-body").addEventListener("change", event => {
    const stageId = state.openStageId;
    if (!stageId) return;
    if (event.target.matches("[data-req-index]")) {
      const index = Number(event.target.dataset.reqIndex);
      const current = state.checklist[stageId] || [];
      state.checklist[stageId] = current.includes(index) ? current.filter(i => i !== index) : [...current, index];
      renderModal();
      const checkbox = $(`#modal-body [data-req-index="${index}"]`);
      if (checkbox) checkbox.focus();
      return;
    }
    if (event.target.id === "file-input") {
      handleUpload(event.target.files);
      return;
    }
  });

  $("#modal-body").addEventListener("change", event => {
    if (event.target.id === "status-select" && state.openStageId) {
      state.statuses[state.openStageId] = event.target.value;
      renderModal();
      renderBoard();
    }
  });

  $("#modal-body").addEventListener("dragover", event => {
    const zone = event.target.closest("#dropzone");
    if (!zone) return;
    event.preventDefault();
    zone.classList.add("is-dragging");
  });
  $("#modal-body").addEventListener("dragleave", event => {
    const zone = event.target.closest("#dropzone");
    if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove("is-dragging");
  });
  $("#modal-body").addEventListener("drop", event => {
    const zone = event.target.closest("#dropzone");
    if (!zone) return;
    event.preventDefault();
    zone.classList.remove("is-dragging");
    handleUpload(event.dataTransfer.files);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (state.openStageId) closeModal();
      else if (state.mobileMenuOpen) {
        $("#sidebar").classList.remove("mobile-open");
        state.mobileMenuOpen = false;
      }
    }
  });
}

function authMessage(error) {
  const messages = { "Invalid login credentials": "Correo o contraseña incorrectos.", "Email not confirmed": "Confirma tu correo antes de iniciar sesión.", "User already registered": "Este correo ya tiene una cuenta. Inicia sesión." };
  return messages[error.message] || error.message || "No se pudo completar la operación.";
}

async function initialize() {
  bindEvents(); renderNav(); renderProgressTab(); renderVault(); renderGuides(); refreshIcons();
  try {
    const session = await getCurrentSession();
    if (session?.user) await enterApp("account", session.user);
  } catch (error) { $("#login-feedback").textContent = `No se pudo recuperar la sesión: ${error.message}`; }
}
document.addEventListener("DOMContentLoaded", initialize);
