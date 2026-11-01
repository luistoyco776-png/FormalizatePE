import { DATA } from "../data/appData.js";

const state = {
  activeTab:'progreso', answers:{}, figure:null,
  statuses:Object.fromEntries(DATA.stages.map(s=>[s.id,s.initialStatus])),
  documents:[...DATA.initialDocuments], checklist:{'reserva-nombre':[0,1]},
  openStageId:null, modalStep:1, stagedStatus:null, lastFocused:null, pendingFiles:[]
};
export { state };
