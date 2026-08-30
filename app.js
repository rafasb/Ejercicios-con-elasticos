const STORAGE_KEY = "ritmo-data-v1";
const DAYS = ["DÍA 1", "DÍA 2", "DÍA 3"];
const app = document.querySelector("#app");
const dialog = document.querySelector("#exercise-dialog");
const form = document.querySelector("#exercise-form");
let activeView = "train";
let activeDay = DAYS[0];
let data = { exercises: [], plans: {}, history: [] };
let workout = {};

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function uid() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function escapeHtml(value = "") { return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]); }
function formatInline(value = "") { return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }
function markdownList(markdown) {
  const items = markdown.split("\n").map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1]).filter(Boolean);
  return items.length ? `<ul>${items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>` : `<p>${formatInline(markdown)}</p>`;
}
function technicalDetails(markdown) {
  const rows = markdown.split("\n").filter((line) => /^\|/.test(line) && !/^\|\s*:?-+/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim())).filter((cells) => cells.length === 2 && cells[0] !== "Parámetro");
  return rows.length ? `<dl class="technical-grid">${rows.map(([term, description]) => `<div><dt>${formatInline(term)}</dt><dd>${formatInline(description)}</dd></div>`).join("")}</dl>` : markdownList(markdown);
}
function getExercise(id) { return data.exercises.find((exercise) => exercise.id === id); }
function toast(message) { const node = document.querySelector("#toast"); node.textContent = message; node.classList.add("visible"); setTimeout(() => node.classList.remove("visible"), 2500); }

function parseRoutine(markdown) {
  const exercises = [];
  let day = "";
  const sections = markdown.split(/(?=^## |^### )/m);
  sections.forEach((section) => {
    const dayMatch = section.match(/^##\s+(DÍA \d+)/m);
    if (dayMatch) { day = dayMatch[1]; return; }
    const heading = section.match(/^###\s+\d+\.\s+(.+?)\s*(?:\(([^)]+)\))?\s*$/m);
    if (!heading || !day) return;
    const summary = (section.match(/^\*([^*]+)\*/m) || ["", ""])[1].trim();
    const execution = (section.match(/#### Ejecución paso a paso\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1].trim();
    const technical = (section.match(/#### Detalles técnicos\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1].trim();
    const errors = (section.match(/#### Errores comunes a evitar\n([\s\S]*?)$/) || ["", ""])[1].trim();
    exercises.push({ id: `seed-${exercises.length + 1}`, name: heading[1].trim(), muscle: heading[2] || "General", summary, instructions: execution, technical, errors, day });
  });
  return exercises;
}

async function initialise() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) { data = JSON.parse(stored); }
  else {
    const response = await fetch("rutina_entrenamiento_bandas.md");
    data.exercises = parseRoutine(await response.text());
    DAYS.forEach((day) => {
      data.plans[day] = data.exercises.filter((exercise) => exercise.day === day).map((exercise) => ({ exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media" }));
    });
    save();
  }
  DAYS.forEach((day) => { data.plans[day] ||= []; });
  render();
}

function daySwitcher() { return `<div class="day-switcher">${DAYS.map((day) => `<button class="day-button ${day === activeDay ? "active" : ""}" data-day="${day}">${day.replace("DÍA ", "Día ")}</button>`).join("")}</div>`; }
function exerciseDetails(exercise) { return `<details class="details"><summary>Ver técnica y detalles</summary><section class="detail-section"><h4>Ejecución</h4>${markdownList(exercise.instructions)}</section>${exercise.technical ? `<section class="detail-section"><h4>Detalles técnicos</h4>${technicalDetails(exercise.technical)}</section>` : ""}${exercise.errors ? `<section class="detail-section"><h4>Errores a evitar</h4>${markdownList(exercise.errors)}</section>` : ""}</details>`; }

function renderTrain() {
  const plan = data.plans[activeDay];
  if (!plan.length) return `${daySwitcher()}<div class="empty-state"><h2>Sesión vacía</h2><p>Añade ejercicios desde Plan para preparar este día.</p></div>`;
  return `${daySwitcher()}<div class="session-heading"><div><h2>${activeDay.replace("DÍA ", "Día ")}</h2><p>Registra cada ejercicio antes de finalizar.</p></div><span class="target">${plan.length} ejercicios</span></div><section class="exercise-list">${plan.map((item, index) => {
    const exercise = getExercise(item.exerciseId); if (!exercise) return "";
    const entry = workout[item.exerciseId] || { reps: item.reps, resistance: item.resistance, rating: "aceptable" };
    return `<article class="exercise-item" data-workout-id="${exercise.id}"><div class="exercise-title"><div><h3>${escapeHtml(exercise.name)}</h3><p>${escapeHtml(exercise.muscle)}</p></div><span class="target">${item.sets} x ${item.reps}<br>${escapeHtml(item.resistance)}</span></div><p>${escapeHtml(exercise.summary)}</p>${exerciseDetails(exercise)}<div class="record-grid"><label>Repeticiones realizadas<input type="number" min="0" inputmode="numeric" data-record="reps" value="${escapeHtml(entry.reps)}"></label><label>Resistencia / peso<input data-record="resistance" value="${escapeHtml(entry.resistance)}"></label></div><div class="exercise-actions">${["fácil", "aceptable", "imposible"].map((rating) => `<button class="rating ${entry.rating === rating ? "selected" : ""}" data-rating="${rating}">${rating}</button>`).join("")}</div></article>`;
  }).join("")}</section><button class="primary-button sticky-action" data-action="finish">Finalizar ${activeDay.replace("DÍA ", "Día ")}</button>`;
}

function renderPlan() {
  const plan = data.plans[activeDay];
  const options = data.exercises.map((exercise) => `<option value="${exercise.id}">${escapeHtml(exercise.name)}</option>`).join("");
  return `${daySwitcher()}<div class="session-heading"><div><h2>Planificar ${activeDay.replace("DÍA ", "Día ")}</h2><p>Ajusta el objetivo de tu siguiente sesión.</p></div></div><section>${plan.map((item, index) => `<div class="plan-row" data-plan-index="${index}"><label>Ejercicio<select data-plan="exerciseId">${options.replace(`value="${item.exerciseId}"`, `value="${item.exerciseId}" selected`)}</select></label><label>Series<input data-plan="sets" type="number" min="1" value="${escapeHtml(item.sets)}"></label><label>Reps. / peso<input data-plan="reps" type="text" value="${escapeHtml(item.reps)}" aria-label="Repeticiones objetivo"><input data-plan="resistance" type="text" value="${escapeHtml(item.resistance)}" aria-label="Resistencia o peso"></label><button class="remove-button" data-action="remove-plan" aria-label="Eliminar ejercicio">×</button></div>`).join("")}</section><div class="action-row"><button class="outline-button" data-action="add-plan">+ Añadir ejercicio</button></div>`;
}

function renderHistory() {
  if (!data.history.length) return `<div class="empty-state"><h2>Aún no hay sesiones</h2><p>Al finalizar un entrenamiento, sus resultados aparecerán aquí.</p></div>`;
  return `<div class="session-heading"><div><h2>Historial</h2><p>Usa una sesión como punto de partida para el próximo ciclo.</p></div></div>${data.history.map((session, index) => `<article class="history-item"><div class="exercise-title"><div><h3>${session.day.replace("DÍA ", "Día ")}</h3><p class="history-meta">${new Date(session.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p></div><button class="outline-button" data-action="reuse" data-history-index="${index}">Usar en plan</button></div>${session.entries.map((entry) => `<div class="result-line"><span>${escapeHtml(entry.name)}</span><span>${escapeHtml(entry.reps)} reps · ${escapeHtml(entry.resistance)} <b class="badge">${escapeHtml(entry.rating)}</b></span></div>`).join("")}</article>`).join("")}`;
}

function renderExercises() { return `<div class="session-heading"><div><h2>Ejercicios</h2><p>${data.exercises.length} disponibles en tu catálogo.</p></div><button class="primary-button" data-action="new-exercise">Añadir</button></div>${data.exercises.map((exercise) => `<article class="catalogue-card"><h3>${escapeHtml(exercise.name)}</h3><p>${escapeHtml(exercise.muscle)} · ${escapeHtml(exercise.summary)}</p>${exerciseDetails(exercise)}</article>`).join("")}`; }
function render() {
  const views = { train: renderTrain, plan: renderPlan, history: renderHistory, exercises: renderExercises };
  app.innerHTML = views[activeView]();
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === activeView));
  document.querySelector("#header-copy").textContent = ({ train: "Tu ciclo semanal, listo para moverse.", plan: "Define objetivos claros para cada sesión.", history: "Mira lo que hiciste y ajusta el rumbo.", exercises: "Técnica antes que velocidad." })[activeView];
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]"); if (viewButton) { activeView = viewButton.dataset.view; render(); return; }
  const dayButton = event.target.closest("[data-day]"); if (dayButton) { activeDay = dayButton.dataset.day; render(); return; }
  const rating = event.target.closest("[data-rating]"); if (rating) { const card = rating.closest("[data-workout-id]"); const id = card.dataset.workoutId; workout[id] ||= {}; workout[id].rating = rating.dataset.rating; render(); return; }
  const action = event.target.closest("[data-action]"); if (!action) return;
  if (action.dataset.action === "new-exercise") dialog.showModal();
  if (action.dataset.action === "add-plan") { data.plans[activeDay].push({ exerciseId: data.exercises[0].id, sets: "3", reps: "12", resistance: "Media" }); save(); render(); }
  if (action.dataset.action === "remove-plan") { data.plans[activeDay].splice(Number(action.closest("[data-plan-index]").dataset.planIndex), 1); save(); render(); }
  if (action.dataset.action === "finish") {
    const entries = data.plans[activeDay].map((item) => { const exercise = getExercise(item.exerciseId); const entry = workout[exercise.id] || {}; return { name: exercise.name, exerciseId: exercise.id, reps: entry.reps || item.reps, resistance: entry.resistance || item.resistance, rating: entry.rating || "aceptable" }; });
    data.history.unshift({ date: new Date().toISOString(), day: activeDay, entries }); save(); workout = {}; toast("Sesión guardada en el historial."); render();
  }
  if (action.dataset.action === "reuse") { const session = data.history[Number(action.dataset.historyIndex)]; data.plans[session.day] = session.entries.map((entry) => ({ exerciseId: entry.exerciseId, sets: "3", reps: entry.reps, resistance: entry.resistance })); save(); activeDay = session.day; activeView = "plan"; toast("Resultados aplicados al plan."); render(); }
});

document.addEventListener("input", (event) => {
  const card = event.target.closest("[data-workout-id]"); if (card && event.target.dataset.record) { const entry = workout[card.dataset.workoutId] ||= {}; entry[event.target.dataset.record] = event.target.value; }
  const row = event.target.closest("[data-plan-index]"); if (row && event.target.dataset.plan) { data.plans[activeDay][Number(row.dataset.planIndex)][event.target.dataset.plan] = event.target.value; save(); }
});

form.addEventListener("submit", (event) => { event.preventDefault(); const fields = new FormData(form); data.exercises.push({ id: uid(), name: fields.get("name"), muscle: fields.get("muscle"), summary: fields.get("summary"), instructions: fields.get("instructions"), technical: "", errors: "", day: "" }); save(); form.reset(); dialog.close(); toast("Ejercicio añadido al catálogo."); render(); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
initialise().catch(() => { app.innerHTML = `<div class="empty-state"><h2>No se pudo cargar la rutina</h2><p>Abre la aplicación desde el servidor de Docker para inicializarla.</p></div>`; });