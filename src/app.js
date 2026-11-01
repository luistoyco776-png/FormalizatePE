import { DATA } from "./data/appData.js";
import { state } from "./state/appState.js";
import { $, $$, escapeHtml, icon, refreshIcons } from "./utils/dom.js";
import { signIn, signUp, signOut, getSession, onAuthChange } from "./services/authService.js";
import { getProfile } from "./services/profileService.js";
import { loadProgress, saveStage as persistStage, saveRequirement, saveFigure } from "./services/progressService.js";
import { listDocuments, uploadDocument } from "./services/documentService.js";
let currentUser=null, currentProfile=null, isGuest=false, authMode="login";
function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.remove('hidden'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.add('hidden'),3000); }
function getStage(id){return DATA.stages.find(s=>s.id===id);}
function statusBadge(status){return `<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${DATA.statusStyles[status]}">${DATA.statusLabels[status]}</span>`;}
function recommend(a){ if(a.socios==='si'||a.patrimonio==='si') return 'sac'; return 'ruc10'; }

function enterApp(){
  isGuest=true; currentUser=null; currentProfile={nombre_mype:"Mi Bodega Pro",legal_figure:null};
  state.answers={}; state.figure=null; state.activeTab="progreso"; state.documents=[...DATA.initialDocuments];
  state.statuses=Object.fromEntries(DATA.stages.map(s=>[s.id,s.initialStatus])); state.checklist={"reserva-nombre":[0,1]};
  showApp();
}
function showApp(){
  $('#login-screen').classList.add('hidden'); $('#app-shell').classList.remove('hidden');
  $('#header-business').textContent=currentProfile?.nombre_mype||'Mi emprendimiento';
  $('#header-user').textContent=isGuest?'Invitado demo':(currentUser?.user_metadata?.full_name||currentUser?.email||'Mi cuenta');
  $('#header-mode').textContent=isGuest?'Modo demostración':'Cuenta personal';
  const displayName=isGuest?'Invitado demo':(currentUser?.user_metadata?.full_name||currentUser?.email||'Usuario');$('#header-avatar').textContent=displayName.split(/[ @]/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('');
  $('#demo-chip').classList.toggle('hidden',!isGuest);
  renderNav(); renderProgressTab(); renderGuides(); setTab('progreso'); renderVault(); refreshIcons();
}
async function hydrateUser(user){
  currentUser=user; isGuest=false;
  let profile=await getProfile(user.id);
  if(!profile){await new Promise(r=>setTimeout(r,500));profile=await getProfile(user.id);}
  currentProfile=profile||{nombre_mype:'Mi emprendimiento',legal_figure:null};
  state.figure=currentProfile.legal_figure||null; state.answers={};
  state.statuses=Object.fromEntries(DATA.stages.map(s=>[s.id,s.initialStatus])); state.checklist={};
  const progress=await loadProgress(user.id);
  progress.stages.forEach(row=>state.statuses[row.stage_id]=row.status);
  progress.requirements.forEach(row=>{const list=state.checklist[row.stage_id]||[];state.checklist[row.stage_id]=row.completed?[...list,row.req_index]:list.filter(i=>i!==row.req_index);});
  state.documents=await listDocuments(user.id); showApp();
}
async function logout(){
  if(!isGuest){try{await signOut();}catch(err){toast(err.message);return;}}
  closeModal(); currentUser=null; currentProfile=null; isGuest=false;
  $('#app-shell').classList.add('hidden'); $('#login-screen').classList.remove('hidden');
  $('#login-form').reset(); $('#login-message').classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}); refreshIcons();
}
function renderNav(){
  const render=(mobile)=>DATA.navItems.map(item=>{
    const active=item.id===state.activeTab;
    const cls=mobile?'mobile-nav-button flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold':'nav-button flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition';
    return `<li><button type="button" data-tab="${item.id}" class="${cls} ${active?'':'text-slate-500 hover:bg-slate-100'}" ${active?'aria-current="page"':''}>${icon(item.icon,'size-4')}<span>${mobile?item.shortLabel:item.label}</span></button></li>`;
  }).join('');
  $('#sidebar-nav').innerHTML=render(false); $('#mobile-nav').innerHTML=render(true); refreshIcons();
}
function setTab(tab){
  state.activeTab=tab;
  $$('[data-tab-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.tabPanel!==tab));
  renderNav(); if(tab==='boveda')renderVault(); if(tab==='guias')renderGuides();
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderWizard(){
  const answered=Object.keys(state.answers).length, complete=answered===DATA.questions.length;
  const figure=complete?recommend(state.answers):null;
  const qs=DATA.questions.map((q,i)=>{
    const opts=[['si',q.yes],['no',q.no]].map(([v,label])=>`<label class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm transition hover:bg-slate-50 ${state.answers[q.id]===v?'border-brand-500 bg-brand-50 text-brand-700':''}"><input type="radio" name="${q.id}" value="${v}" ${state.answers[q.id]===v?'checked':''} class="accent-indigo-600">${label}</label>`).join('');
    return `<li class="rounded-xl border border-line p-4"><fieldset><legend class="flex gap-3"><span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">${i+1}</span><span><span class="block text-sm font-bold">${q.question}</span><span class="mt-1 block text-sm leading-5 text-slate-500">${q.help}</span></span></legend><div class="mt-4 grid grid-cols-2 gap-2 pl-10">${opts}</div></fieldset></li>`;
  }).join('');
  let recommendation=`<div class="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-slate-50 p-6 text-center">${icon('route','size-9 text-slate-400')}<p class="mt-3 font-semibold">Tu orientación aparecerá aquí</p><p class="mt-1 text-sm text-slate-500">Responde las tres preguntas para ver una orientación inicial.</p></div>`;
  if(figure){const info=DATA.legalFigures[figure];recommendation=`<div class="rounded-xl border border-brand-200 bg-brand-50/70 p-5"><p class="text-xs font-bold uppercase tracking-wider text-brand-700">Orientación preliminar</p><h3 class="mt-2 text-xl font-bold">${info.title}</h3><p class="mt-3 text-sm leading-6 text-slate-600">${info.summary}</p><ul class="mt-4 space-y-2">${info.highlights.map(x=>`<li class="flex gap-2 text-sm">${icon('check-circle','mt-0.5 size-4 shrink-0 text-green-600')}<span>${x}</span></li>`).join('')}</ul><p class="mt-4 rounded-lg bg-white/80 p-3 text-xs leading-5 text-slate-600">Esta orientación es demostrativa y no sustituye una evaluación legal o tributaria. Confirma tu caso en fuentes oficiales.</p><button type="button" id="start-btn" data-figure="${figure}" class="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">Ver mi ruta de formalización ${icon('arrow-right')}</button></div>`;}
  $('#wizard').innerHTML=`<div class="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><div class="border-b border-line bg-gradient-to-r from-brand-50 to-white p-5 sm:p-7"><p class="flex items-center gap-2 text-sm font-bold text-brand-700">${icon('sparkles')} PERFILAMIENTO INICIAL · ${answered} DE ${DATA.questions.length}</p><h2 class="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Conoce tu posible ruta de formalización</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Responde estas preguntas para obtener una orientación inicial. La ruta depende de las características de tu negocio y debe validarse con las entidades competentes.</p></div><div class="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_.9fr]"><ol class="space-y-3">${qs}</ol><div>${recommendation}</div></div></div>`;
  refreshIcons();
}
function renderBoard(){
  const figure=state.figure, completed=DATA.stages.filter(s=>state.statuses[s.id]==='completado').length;
  const applicable=DATA.stages.filter(s=>figure!=='ruc10'||s.appliesToRuc10);
  const cards=DATA.stages.map(stage=>{
    const status=state.statuses[stage.id], optional=figure==='ruc10'&&!stage.appliesToRuc10;
    return `<li><article class="stage-card relative flex h-full flex-col rounded-xl border border-line bg-white p-4 shadow-sm ${optional?'opacity-70':''}"><div class="flex items-start justify-between gap-2"><span class="flex size-8 items-center justify-center rounded-full ${status==='completado'?'bg-green-600 text-white':'bg-slate-100 text-slate-600'} text-xs font-bold">${stage.step}</span>${statusBadge(status)}</div><p class="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-700">${stage.entity}</p><h3 class="mt-1 text-base font-bold leading-6">${stage.title}</h3><p class="mt-2 text-sm text-slate-500">${stage.duration}</p><div class="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4 mt-4"><span class="text-sm font-semibold">${stage.cost}</span><button type="button" data-open-stage="${stage.id}" class="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-900">${optional?'Ver etapa':'Abrir'} ${icon('chevron-right','size-4')}</button></div></article></li>`;
  }).join('');
  const pct=Math.round(completed/DATA.stages.length*100);
  $('#board').innerHTML=`<div class="space-y-6"><div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p class="text-sm font-semibold text-brand-700">Ruta: ${DATA.legalFigures[figure].title}</p><h2 class="mt-1 text-3xl font-bold tracking-tight">Mi progreso</h2><p class="mt-2 text-sm text-slate-500">Abre una etapa para revisar requisitos, adjuntar archivos y registrar tu avance.</p></div><button id="restart-btn" class="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-line bg-white px-3 text-sm font-semibold hover:bg-slate-50">${icon('rotate-ccw')}Rehacer perfilamiento</button></div><div class="rounded-2xl border border-line bg-white p-5 shadow-sm sm:flex sm:items-center sm:gap-6"><div class="mb-3 sm:mb-0"><p class="text-3xl font-bold tabular-nums">${pct}%</p><p class="text-sm text-slate-500">${completed} de ${DATA.stages.length} etapas completadas</p></div><div class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div class="progress-bar h-full rounded-full bg-brand-600" style="width:${pct}%"></div></div></div><div class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-800">${icon('info','mt-0.5 size-5 shrink-0')}<p><strong>Prototipo académico:</strong> los estados se actualizan manualmente. Costos y plazos son referenciales; confirma requisitos y tasas vigentes en las entidades correspondientes.</p></div><ol class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">${cards}</ol></div>`;
}
function renderProgressTab(){
  const hasFigure=state.figure!==null;$('#wizard').classList.toggle('hidden',hasFigure);$('#board').classList.toggle('hidden',!hasFigure);
  $('#figure-badge').textContent=hasFigure?DATA.legalFigures[state.figure].short:'';
  if(hasFigure)renderBoard();else renderWizard();
}
function renderModal(){
  const stage=getStage(state.openStageId);if(!stage)return;
  const checked=state.checklist[stage.id]||[],docs=state.documents.filter(d=>d.stageId===stage.id);
  const omitted=stage.requirements.length-checked.length;
  const requirements=stage.requirements.map((req,i)=>`<li><label class="check-row flex cursor-pointer items-start gap-3 rounded-xl border border-line px-3 py-3 text-sm leading-5 transition"><input type="checkbox" data-req-index="${i}" ${checked.includes(i)?'checked':''} class="mt-0.5 size-4 shrink-0"><span>${req}</span></label></li>`).join('');
  const docsHtml=docs.length?`<ul class="mt-3 space-y-2">${docs.map(d=>`<li class="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">${icon('file-text','size-4 text-brand-700')}<span class="min-w-0 flex-1 truncate font-semibold">${escapeHtml(d.name)}</span><span class="text-xs text-slate-500">${d.sizeKb} KB</span>${d.demo?'<span class="text-[10px] font-bold uppercase text-slate-400">Demo</span>':''}</li>`).join('')}</ul>`:'<p class="mt-3 text-sm text-slate-500">Todavía no hay archivos adjuntos a esta etapa.</p>';
  const links=stage.links.map(l=>`<a href="${l.href}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-900">${escapeHtml(l.label)} ${icon('external-link','size-3.5')}</a>`).join('');
  const currentStatus=state.stagedStatus||state.statuses[stage.id];
  let body='';
  if(state.modalStep===1){
    body=`<section><p class="text-xs font-bold uppercase tracking-wider text-brand-700">Subfase 1 de 3</p><h3 class="mt-2 text-xl font-bold">Verificación de requisitos</h3><p class="mt-2 text-sm leading-6 text-slate-600">Marque las condiciones con las que cuenta actualmente antes de iniciar el trámite presencial o virtual.</p><div class="mt-5 flex items-center justify-between"><p class="text-sm font-semibold">Lista de verificación</p><span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">${checked.length} de ${stage.requirements.length}</span></div><ul class="mt-3 space-y-2">${requirements}</ul><p class="mt-4 text-xs leading-5 text-slate-500">Marcar un requisito indica que el usuario declara contar con él; no constituye una validación oficial del documento.</p></section>`;
  } else if(state.modalStep===2){
    body=`<section><p class="text-xs font-bold uppercase tracking-wider text-brand-700">Subfase 2 de 3</p><h3 class="mt-2 text-xl font-bold">Expediente digital</h3><p class="mt-2 text-sm leading-6 text-slate-600">Adjunte la evidencia digital de su trámite para su expediente unificado de empresa.</p><label class="dropzone mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl px-5 py-9 text-center" id="dropzone"><span class="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">${icon('upload','size-6')}</span><span class="mt-3 font-semibold">${stage.uploadHint}</span><span class="mt-1 text-sm text-slate-500">Arrastra archivos aquí o haz clic para seleccionarlos</span><span class="mt-1 text-xs text-slate-400">PDF, JPG o PNG · Máximo 10 MB por archivo</span><input type="file" id="file-input" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" class="sr-only"></label><div id="pending-files" class="mt-3 space-y-2">${state.pendingFiles.map(f=>`<p class="rounded-lg bg-brand-50 p-2 text-sm text-brand-800">${icon('paperclip','inline size-4')} ${escapeHtml(f.name)} <span class="text-xs">· pendiente de guardar</span></p>`).join('')}</div><div class="mt-6 border-t border-line pt-4"><p class="text-sm font-semibold">Archivos en esta etapa</p>${docsHtml}</div><p class="mt-4 text-xs leading-5 text-slate-500">En este prototipo, los archivos se conservan en memoria mientras la página está abierta. No se suben a un servidor.</p></section>`;
  } else {
    body=`<section><p class="text-xs font-bold uppercase tracking-wider text-brand-700">Subfase 3 de 3</p><h3 class="mt-2 text-xl font-bold">Resumen y confirmación</h3><p class="mt-2 text-sm leading-6 text-slate-600">Revisa tus respuestas y registra el estado que refleje tu avance actual.</p>${omitted?`<div class="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-800">${icon('alert-triangle','mt-0.5 size-5 shrink-0')}<p><strong>Atención:</strong> Ha omitido ${omitted} ${omitted===1?'requisito':'requisitos'}. Le recomendamos completarlos para reducir el riesgo de observaciones. Esta lista es orientativa y puede no cubrir todos los requisitos oficiales.</p></div>`:`<div class="mt-5 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">${icon('check-circle','size-5 shrink-0')}<p>Has marcado todos los requisitos de esta lista. Confirma igualmente las condiciones oficiales antes de iniciar el trámite.</p></div>`}<div class="mt-5 grid gap-3 sm:grid-cols-2"><div class="rounded-xl border border-line p-4"><p class="text-xs text-slate-500">Requisitos marcados</p><p class="mt-1 text-2xl font-bold">${checked.length}/${stage.requirements.length}</p></div><div class="rounded-xl border border-line p-4"><p class="text-xs text-slate-500">Documentos asociados</p><p class="mt-1 text-2xl font-bold">${docs.length+state.pendingFiles.length}</p></div></div><label for="status-select" class="mt-5 block text-sm font-semibold">Estado de la etapa</label><select id="status-select" class="field mt-2"><option value="no-iniciado" ${currentStatus==='no-iniciado'?'selected':''}>No iniciado</option><option value="pendiente" ${currentStatus==='pendiente'?'selected':''}>Pendiente</option><option value="en-proceso" ${currentStatus==='en-proceso'?'selected':''}>En proceso</option><option value="completado" ${currentStatus==='completado'?'selected':''}>Completado</option></select><p class="mt-2 text-xs leading-5 text-slate-500">El estado es declarado manualmente por el usuario; no representa una consulta al sistema de la entidad.</p></section>`;
  }
  const steps=[1,2,3].map(n=>`<button type="button" data-step="${n}" class="step-circle ${state.modalStep===n?'':' '+(state.modalStep>n?'is-done':'')}" ${state.modalStep===n?'aria-current="step"':''} aria-label="Ir a subfase ${n}">${state.modalStep>n?icon('check','size-4'):n}</button>`).join('<span class="step-line"></span>');
  $('#modal-body').innerHTML=`<div class="border-b border-line bg-gradient-to-r from-brand-50 to-white px-5 pb-5 pt-6 pr-16 sm:px-7 sm:pt-7 sm:pr-16"><div class="flex flex-wrap items-center gap-2"><span class="rounded-md bg-white px-2 py-1 text-xs font-bold text-brand-700 shadow-sm">ETAPA ${stage.step}</span><span class="text-xs font-semibold text-slate-500">${escapeHtml(stage.entity)}</span>${statusBadge(state.statuses[stage.id])}</div><h2 id="modal-title" class="mt-3 text-2xl font-bold">${escapeHtml(stage.title)}</h2><p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(stage.description)}</p><div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><span><strong>Costo:</strong> ${escapeHtml(stage.cost)}</span><span><strong>Plazo:</strong> ${escapeHtml(stage.duration)}</span></div></div><div class="px-5 py-5 sm:px-7"><div class="mx-auto mb-6 flex max-w-xs items-center gap-3" aria-label="Pasos del asistente">${steps}</div>${body}<div class="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">${state.modalStep>1?'<button type="button" id="wizard-back" class="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-slate-50">'+icon('arrow-left')+'Atrás</button>':'<span></span>'}${state.modalStep<3?`<button type="button" id="wizard-next" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">Siguiente ${icon('arrow-right')}</button>`:`<button type="button" id="save-stage" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">${icon('check')}Guardar y finalizar etapa</button>`}</div><div class="mt-5 border-t border-line pt-4"><p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Enlaces oficiales</p><div class="flex flex-wrap gap-x-5 gap-y-2">${links}</div></div></div>`;
  refreshIcons();
}
function openModal(stageId){
  state.openStageId=stageId;state.modalStep=1;state.stagedStatus=state.statuses[stageId];state.pendingFiles=[];
  state.lastFocused=document.activeElement;renderModal();$('#stage-modal').classList.remove('hidden');document.body.classList.add('modal-open');$('[data-close-modal]',$('#stage-modal')).focus();
}
function closeModal(){
  if($('#stage-modal').classList.contains('hidden'))return;
  $('#stage-modal').classList.add('hidden');document.body.classList.remove('modal-open');state.openStageId=null;state.pendingFiles=[];
  if(state.lastFocused&&state.lastFocused.focus)state.lastFocused.focus();
}
function addFiles(fileList){
  const allowed=['application/pdf','image/jpeg','image/png'];
  Array.from(fileList||[]).forEach(file=>{
    const ext=file.name.split('.').pop().toLowerCase();
    if(!allowed.includes(file.type)&&!['pdf','jpg','jpeg','png'].includes(ext)){toast(`Formato no admitido: ${file.name}`);return;}
    if(file.size>10*1024*1024){toast(`${file.name} supera el máximo de 10 MB`);return;}
    if(!state.pendingFiles.some(f=>f.name===file.name&&f.size===file.size))state.pendingFiles.push(file);
  });
  renderModal();
}
async function saveStage(){
  const id=state.openStageId;if(!id)return;
  try{
    const added=[];
    for(const file of state.pendingFiles){
      if(currentUser) added.push(await uploadDocument(currentUser.id,id,file));
      else added.push({id:`guest-${crypto.randomUUID()}`,name:file.name,sizeKb:Math.max(1,Math.round(file.size/1024)),stageId:id,uploadedAt:new Date().toLocaleDateString('es-PE'),url:URL.createObjectURL(file),demo:false});
    }
    state.documents=[...added,...state.documents];
    state.statuses[id]=state.stagedStatus||state.statuses[id];
    if(added.length&&state.statuses[id]==='no-iniciado')state.statuses[id]='en-proceso';
    if(currentUser)await persistStage(currentUser.id,id,state.statuses[id]);
    closeModal();renderBoard();if(state.activeTab==='boveda')renderVault();
    toast(isGuest?'Etapa actualizada en esta demostración.':'Etapa guardada en tu cuenta.');
  }catch(err){toast(`No se pudo guardar: ${err.message}`);}
}
function renderVault(){
  const total=state.documents.reduce((n,d)=>n+d.sizeKb,0);
  const groups=DATA.stages.map(stage=>{
    const docs=state.documents.filter(d=>d.stageId===stage.id);
    return `<article class="overflow-hidden rounded-xl border border-line bg-white"><div class="flex items-center justify-between gap-3 border-b border-line bg-slate-50 px-4 py-3"><div class="flex items-center gap-2"><span class="flex size-7 items-center justify-center rounded-full bg-white text-xs font-bold">${stage.step}</span><h3 class="text-sm font-bold">${stage.title}</h3></div><span class="text-xs text-slate-500">${docs.length} archivo${docs.length===1?'':'s'}</span></div>${docs.length?`<ul class="divide-y divide-line">${docs.map(d=>`<li class="flex items-center gap-3 px-4 py-3">${icon('file-text','size-5 text-brand-700')}<div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">${escapeHtml(d.name)}</p><p class="text-xs text-slate-500">${d.sizeKb} KB · ${d.uploadedAt}</p></div>${d.url?`<a href="${d.url}" target="_blank" rel="noopener noreferrer" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Abrir archivo">${icon('external-link')}</a>`:''}${d.demo?'<span class="text-[10px] font-bold uppercase text-slate-400">Demo</span>':''}</li>`).join('')}</ul>`:'<p class="px-4 py-4 text-sm text-slate-500">Aún no hay documentos para esta etapa.</p>'}</article>`;
  }).join('');
  $('#tab-boveda').innerHTML=`<div class="space-y-5"><div><p class="text-sm font-semibold text-brand-700">EXPEDIENTE DIGITAL</p><h2 class="mt-1 text-3xl font-bold">Bóveda de documentos</h2><p class="mt-2 text-sm text-slate-500">${state.documents.length} archivos de ejemplo o adjuntos · ${total.toLocaleString('es-PE')} KB</p></div><div class="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-5 text-brand-900">${icon('shield-check','mt-0.5 size-5 shrink-0')}<p>${isGuest?"Modo invitado: los archivos solo se conservan durante esta sesión.":"Almacenamiento privado: tus documentos se guardan en tu cuenta y solo tú puedes consultarlos."} No se envían a entidades públicas.</p></div><div class="grid gap-4 md:grid-cols-2">${groups}</div></div>`;
  refreshIcons();
}
function renderGuides(){
  $('#tab-guias').innerHTML=`<div class="max-w-4xl space-y-5"><div><p class="text-sm font-semibold text-brand-700">FUENTES DE CONSULTA</p><h2 class="mt-1 text-3xl font-bold">Guías oficiales</h2><p class="mt-2 text-sm leading-6 text-slate-500">Consulta las fuentes antes de iniciar una gestión. Los enlaces son accesos de referencia y debes comprobar que la página corresponda a tu caso.</p></div><ul class="grid gap-3 sm:grid-cols-2">${DATA.officialGuides.map(g=>`<li><a href="${g.href}" target="_blank" rel="noopener noreferrer" class="group flex h-full gap-4 rounded-xl border border-line bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"><span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">${icon('landmark','size-5')}</span><span class="min-w-0 flex-1"><span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">${g.entity}</span><span class="mt-1 block font-bold">${g.label}</span><span class="mt-2 block text-sm leading-5 text-slate-500">${g.description}</span><span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Consultar fuente ${icon('external-link','size-3.5')}</span></span></a></li>`).join('')}</ul><p class="rounded-xl bg-slate-100 p-4 text-xs leading-5 text-slate-600">Nota: este prototipo no está integrado con Gob.pe, SUNARP, SUNAT ni municipalidades. No confirma requisitos vigentes ni consulta el estado real de los trámites.</p></div>`;
  refreshIcons();
}

function updateAuthMode(){const signup=authMode==='signup';$('#auth-title').textContent=signup?'Crear cuenta':'Bienvenido';$('#full-name-wrap').classList.toggle('hidden',!signup);$('#auth-submit').textContent=signup?'Crear cuenta':'Iniciar sesión';$('#auth-mode-toggle').textContent=signup?'Ya tengo cuenta · Iniciar sesión':'¿No tienes cuenta? Regístrate';$('#password').autocomplete=signup?'new-password':'current-password';$('#login-message').classList.add('hidden');}
function translateAuthError(message){const map={'Invalid login credentials':'Correo o contraseña incorrectos.','Email not confirmed':'Confirma tu correo antes de iniciar sesión.','User already registered':'Este correo ya está registrado. Inicia sesión.'};return map[message]||message||'Error de autenticación.';}
async function initializeApp(){
  $('#guest-btn').addEventListener('click',enterApp);$('#logout-btn').addEventListener('click',logout);
  $('#auth-mode-toggle').addEventListener('click',()=>{authMode=authMode==='login'?'signup':'login';updateAuthMode();});
  $('#login-form').addEventListener('submit',async e=>{e.preventDefault();const email=$('#email').value.trim(),password=$('#password').value,nombre=$('#full-name')?.value.trim()||'';const msg=$('#login-message');msg.textContent='Procesando...';msg.classList.remove('hidden');try{if(authMode==='signup'){if(password.length<8)throw new Error('La contraseña debe tener al menos 8 caracteres.');const result=await signUp(email,password,nombre);if(result.session)await hydrateUser(result.user);else msg.textContent='Cuenta creada. Revisa tu correo para confirmar la dirección y luego inicia sesión.';}else{const result=await signIn(email,password);await hydrateUser(result.user);}}catch(err){msg.textContent=translateAuthError(err.message);}});
  bindApplicationEvents();
  renderNav();renderProgressTab();renderGuides();renderVault();refreshIcons();
  try{const session=await getSession();if(session?.user)await hydrateUser(session.user);}catch(err){toast(err.message);}
  onAuthChange((event,session)=>{if(event==='SIGNED_OUT'&&!isGuest){currentUser=null;currentProfile=null;$('#app-shell').classList.add('hidden');$('#login-screen').classList.remove('hidden');}});
}
function bindApplicationEvents(){
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-tab]');if(tab){setTab(tab.dataset.tab);return;}
    const open=e.target.closest('[data-open-stage]');if(open){openModal(open.dataset.openStage);return;}
    if(e.target.closest('[data-close-modal]')){closeModal();return;}
    const start=e.target.closest('#start-btn');if(start){state.figure=start.dataset.figure;if(currentUser)saveFigure(currentUser.id,state.figure).catch(err=>toast(err.message));renderProgressTab();return;}
    if(e.target.closest('#restart-btn')){state.figure=null;state.answers={};if(currentUser)saveFigure(currentUser.id,null).catch(err=>toast(err.message));renderProgressTab();return;}
    const step=e.target.closest('[data-step]');if(step){state.modalStep=Number(step.dataset.step);renderModal();return;}
    if(e.target.closest('#wizard-back')){state.modalStep=Math.max(1,state.modalStep-1);renderModal();return;}
    if(e.target.closest('#wizard-next')){state.modalStep=Math.min(3,state.modalStep+1);renderModal();return;}
    if(e.target.closest('#save-stage')){saveStage();return;}
  });
  $('#wizard').addEventListener('change',e=>{if(e.target.matches('input[type=radio]')){state.answers[e.target.name]=e.target.value;renderWizard();}});
  $('#modal-body').addEventListener('change',e=>{const id=state.openStageId;if(!id)return;if(e.target.matches('[data-req-index]')){const idx=Number(e.target.dataset.reqIndex),cur=state.checklist[id]||[],completed=!cur.includes(idx);state.checklist[id]=completed?[...cur,idx]:cur.filter(i=>i!==idx);if(currentUser)saveRequirement(currentUser.id,id,idx,completed).catch(err=>toast(err.message));renderModal();}else if(e.target.id==='file-input')addFiles(e.target.files);else if(e.target.id==='status-select')state.stagedStatus=e.target.value;});
  $('#modal-body').addEventListener('dragover',e=>{const zone=e.target.closest('.dropzone');if(zone){e.preventDefault();zone.classList.add('is-dragging');}});
  $('#modal-body').addEventListener('dragleave',e=>{const zone=e.target.closest('.dropzone');if(zone)zone.classList.remove('is-dragging');});
  $('#modal-body').addEventListener('drop',e=>{const zone=e.target.closest('.dropzone');if(zone){e.preventDefault();zone.classList.remove('is-dragging');addFiles(e.dataTransfer.files);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.openStageId)closeModal();});
}
document.addEventListener('DOMContentLoaded',initializeApp);
