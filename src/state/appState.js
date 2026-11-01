import { DATA } from "../data/appData.js";

export const createInitialState = () => ({
  activeTab: "progreso", answers: {}, figure: null,
  statuses: Object.fromEntries(DATA.stages.map(stage => [stage.id, stage.initialStatus])),
  documents: [], checklist: {}, openStageId: null, modalPhase: 1,
  lastFocused: null, mobileMenuOpen: false, mode: "guest", user: null,
  profile: { nombre_mype: "Mi Bodega Pro", legal_figure: null, diagnostic_answers: {} }
});

export const state = createInitialState();

export function resetState(mode = "guest", user = null) {
  const fresh = createInitialState();
  Object.assign(state, fresh, { mode, user });
  if (mode === "guest") {
    state.documents = DATA.initialDocuments.map(doc => ({ ...doc, demo: true }));
    state.checklist = { "reserva-nombre": [0, 1], "ruc-clave-sol": [0, 1, 2] };
  }
  return state;
}
