const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"})[char]);
}
function icon(name, className = "") { return `<i data-lucide="${name}"${className ? ` class="${className}"` : ""} aria-hidden="true"></i>`; }
function refreshIcons() { if (window.lucide) window.lucide.createIcons(); }
export { $, $$, escapeHtml, icon, refreshIcons };
