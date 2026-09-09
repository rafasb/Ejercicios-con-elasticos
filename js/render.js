import { RATING_OPTIONS, VIEW_COPY } from "./constants.js";
import { escapeHtml, exerciseDetails, historyToggle, renderHistoryCalendar, renderHistorySession, tagBadges, tagFilter, tagSummary } from "./utils.js";
import { configuredDays, getCurrentPlan, getExercise, sortedHistory, state } from "./state.js";

function daySwitcher() {
  return `<div class="day-switcher">${configuredDays().map((day) => `<button class="day-button ${day === state.activeDay ? "active" : ""}" data-day="${day}">${day.replace("DÍA ", "Día ")}</button>`).join("")}</div>`;
}

function renderTrain() {
  const plan = getCurrentPlan();
  if (!plan.length) return `${daySwitcher()}<div class="empty-state"><h2>Sesión vacía</h2><p>Añade ejercicios desde Plan para preparar este día.</p></div>`;
  return `${daySwitcher()}<div class="session-heading"><div><h2>${state.activeDay.replace("DÍA ", "Día ")}</h2><p>Registra cada ejercicio antes de finalizar.</p></div><span class="target">${plan.length} ejercicios</span></div><section class="exercise-list">${plan.map((item) => {
    const exercise = getExercise(item.exerciseId); if (!exercise) return "";
    const entry = state.workout[item.exerciseId] || { reps: item.reps, resistance: item.resistance, rating: "aceptable" };
    const completed = Number.isFinite(state.workout[item.exerciseId]?.completedSets) ? state.workout[item.exerciseId].completedSets : 0;
    return `<article class="exercise-item" data-workout-id="${exercise.id}"><div class="exercise-title"><div><h3>${escapeHtml(exercise.name)}</h3><p>${escapeHtml(exercise.muscle)}</p></div><span class="target">${item.sets} x ${item.reps}<br>${escapeHtml(item.resistance)}</span></div><p>${escapeHtml(exercise.summary)}</p>${exerciseDetails(exercise)}<div class="record-grid"><label>Repeticiones realizadas<input type="number" min="0" inputmode="numeric" data-record="reps" value="${escapeHtml(entry.reps)}"></label><label>Resistencia / peso<input data-record="resistance" value="${escapeHtml(entry.resistance)}"></label></div><div class="exercise-actions"><output class="sets-counter" aria-label="Series realizadas">${completed}</output><button class="guide-play" data-action="start-guide" data-exercise-id="${exercise.id}" data-sets="${escapeHtml(item.sets)}" data-repetitions="${escapeHtml(item.reps)}" aria-label="Iniciar guía para ${escapeHtml(exercise.name)}"><span aria-hidden="true">▶</span> Guía</button><button class="outline-button" data-action="show-videos" data-exercise-id="${exercise.id}">Vídeos</button>${RATING_OPTIONS.map((rating) => `<button class="rating ${entry.rating === rating ? "selected" : ""}" data-rating="${rating}">${rating}</button>`).join("")}</div></article>`;
  }).join("")}</section><button class="primary-button sticky-action" data-action="finish">Finalizar ${state.activeDay.replace("DÍA ", "Día ")}</button>`;
}

function renderExercises() {
  const filteredExercises = state.data.exercises.filter((exercise) => state.selectedTags.every((tag) => exercise.tags?.includes(tag)));
  return `<div class="exercise-tools"><button class="outline-button" data-action="backup">Backup</button><button class="outline-button" data-action="restore">Restore</button><button class="outline-button" data-action="guide-settings">Ajustar guía</button></div><div class="session-heading"><div><h2>Ejercicios</h2><p>${filteredExercises.length} de ${state.data.exercises.length} disponibles en tu catálogo.</p></div><button class="primary-button" data-action="new-exercise">Añadir</button></div>${tagFilter(state.selectedTags)}${filteredExercises.map((exercise) => `<article class="catalogue-card"><div class="catalogue-heading"><div><h3>${escapeHtml(exercise.name)}</h3><p>${escapeHtml(exercise.muscle)} · ${escapeHtml(exercise.summary)}</p>${tagBadges(exercise)}</div><div class="heading-actions"><button class="outline-button" data-action="show-videos" data-exercise-id="${exercise.id}">Vídeos</button><button class="outline-button" data-action="edit-exercise" data-exercise-id="${exercise.id}">Editar</button></div></div>${exerciseDetails(exercise)}</article>`).join("") || `<div class="empty-state"><h2>Sin coincidencias</h2><p>Prueba a quitar alguna etiqueta del filtro.</p></div>`}`;
}

function renderPlan() {
  const plan = getCurrentPlan();
  function guideInputs(item) {
    const guide = item.guide || {};
    return `<div class="plan-guide"><label>Tensión (s)<input data-plan-guide="tension" type="number" min="0" inputmode="numeric" value="${guide.tension ?? 0}"></label><label>Pausa (s)<input data-plan-guide="pause" type="number" min="0" inputmode="numeric" value="${guide.pause ?? 0}"></label><label>Distensión (s)<input data-plan-guide="distension" type="number" min="0" inputmode="numeric" value="${guide.distension ?? 0}"></label></div>`;
  }
  return `<section class="cycle-settings" aria-labelledby="cycle-settings-title"><div><h2 id="cycle-settings-title">Ciclo semanal</h2><p>Configura los días que quieres entrenar cada semana.</p></div><label>Días de entrenamiento<input type="number" min="3" max="7" value="${configuredDays().length}" inputmode="numeric" data-setting="day-count"></label></section>${tagSummary(Object.values(state.data.plans).flat(), "Resumen muscular semanal", getExercise)}${daySwitcher()}<div class="session-heading"><div><h2>Planificar ${state.activeDay.replace("DÍA ", "Día ")}</h2><p>Ajusta el objetivo de tu siguiente sesión.</p></div></div>${tagSummary(plan, `Resumen muscular de ${state.activeDay.replace("DÍA ", "Día ")}`, getExercise)}<section>${plan.map((item, index) => { const exercise = getExercise(item.exerciseId); return `<div class="plan-row" data-plan-index="${index}"><div class="plan-exercise-field"><span>Ejercicio</span><button type="button" class="plan-exercise-picker" data-action="open-plan-exercise-dialog" data-plan-index="${index}" aria-haspopup="dialog">${escapeHtml(exercise.name)}${tagBadges(exercise)}</button></div><label>Series<input data-plan="sets" type="number" min="1" value="${escapeHtml(item.sets)}"></label><label class="plan-repetitions">Repeticiones<input data-plan="reps" type="text" value="${escapeHtml(item.reps)}" aria-label="Repeticiones objetivo"></label><label class="plan-resistance">Peso o fuerza<input data-plan="resistance" type="text" value="${escapeHtml(item.resistance)}" aria-label="Peso o fuerza"></label>${guideInputs(item)}<button class="remove-button" data-action="remove-plan" aria-label="Eliminar ejercicio">×</button></div>`; }).join("")}</section><div class="action-row"><button class="outline-button" data-action="add-plan">+ Añadir ejercicio</button></div>`;
}

function renderHistory() {
  const sessions = sortedHistory();
  const heading = `<div class="session-heading"><div><h2>Historial</h2><p>Usa una sesión como punto de partida para el próximo ciclo.</p></div></div>${historyToggle(state.historyDisplay)}`;
  if (!sessions.length) return `${heading}<div class="empty-state"><h2>Aún no hay sesiones</h2><p>Al finalizar un entrenamiento, sus resultados aparecerán aquí.</p></div>`;
  return `${heading}${state.historyDisplay === "calendar" ? renderHistoryCalendar(sessions, state.historyMonth, state.selectedHistoryDate) : sessions.map((session, index) => renderHistorySession(session, index)).join("")}`;
}

export function renderApp() {
  const views = { train: renderTrain, plan: renderPlan, history: renderHistory, exercises: renderExercises };
  document.querySelector("#app").innerHTML = views[state.activeView]();
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === state.activeView));
  const headerCopy = document.querySelector("#header-copy");
  if (headerCopy) headerCopy.textContent = VIEW_COPY[state.activeView];
}

export { renderTrain, renderPlan, renderHistory, renderExercises };
