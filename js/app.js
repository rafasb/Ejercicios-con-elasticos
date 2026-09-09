import { DEFAULT_GUIDE_SETTINGS, EXERCISE_DETAIL_FIELDS, GUIDE_FIELDS, MUSCLE_TAGS, ROUTINE_URL } from "./constants.js";
import { completedSets, escapeHtml, guideForExercise, listForForm, listForStorage, normaliseTags, repetitionsToCycles, seconds, tagsForForm, videosForStorage } from "./utils.js";
import { state, save, configuredDays, createDays, downloadBackup, getExercise, getCurrentPlan, initialise, restoreBackup, setDayCount, sortedHistory } from "./state.js";
import { renderApp } from "./render.js";

const app = document.querySelector("#app");
const restoreInput = document.querySelector("#restore-input");
const dialog = document.querySelector("#exercise-dialog");
const form = document.querySelector("#exercise-form");
const guideDialog = document.querySelector("#guide-dialog");
const guideExerciseName = document.querySelector("#guide-exercise-name");
const guidePhase = document.querySelector("#guide-phase");
const guideCountdown = document.querySelector("#guide-countdown");
const guideCycle = document.querySelector("#guide-cycle");
const guideSettingsDialog = document.querySelector("#guide-settings-dialog");
const guideSettingsForm = document.querySelector("#guide-settings-form");
const guideVolumeValue = document.querySelector("#guide-volume-value");
const videosDialog = document.querySelector("#videos-dialog");
const videosExerciseName = document.querySelector("#videos-exercise-name");
const videosList = document.querySelector("#videos-list");
const planExerciseDialog = document.querySelector("#plan-exercise-dialog");
const planExerciseTagFilter = document.querySelector("#plan-exercise-tag-filter");
const planExerciseList = document.querySelector("#plan-exercise-list");

function toast(message) {
  const node = document.querySelector("#toast");
  node.textContent = message;
  node.classList.add("visible");
  setTimeout(() => node.classList.remove("visible"), 2500);
}

function openGuideSettings() {
  guideSettingsForm.elements.preparation.value = state.data.guide.preparation;
  guideSettingsForm.elements.volume.value = state.data.guide.volume;
  updateVolumeLabel(state.data.guide.volume);
  guideSettingsDialog.showModal();
}

function updateVolumeLabel(value) {
  guideVolumeValue.value = `${Math.round(Number(value) * 100)} %`;
  guideVolumeValue.textContent = guideVolumeValue.value;
}

function playCue(frequency) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  state.audioContext ||= new AudioContext();
  state.audioContext.resume();
  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(state.data.guide.volume, state.audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, state.audioContext.currentTime + .18);
  oscillator.connect(gain).connect(state.audioContext.destination);
  oscillator.start();
  oscillator.stop(state.audioContext.currentTime + .18);
}

function updateGuide(phase, secondsLeft, cycle) {
  guidePhase.textContent = phase;
  guideCountdown.textContent = secondsLeft;
  guideCycle.textContent = cycle ? `Serie ${state.guideState.set} de ${state.guideState.sets} · Repetición ${cycle} de ${state.guideState.cycles}` : `Preparación: ${state.guideState.sets} series de ${state.guideState.cycles}`;
}

function runGuidePhase(phase, secondsLeft, cycle, frequency, next) {
  if (secondsLeft === 0) { next(); return; }
  clearInterval(state.guideTimer);
  updateGuide(phase, secondsLeft, cycle);
  playCue(frequency);
  let remaining = secondsLeft;
  state.guideTimer = setInterval(() => {
    remaining -= 1;
    updateGuide(phase, remaining, cycle);
    if (remaining !== 0) return;
    clearInterval(state.guideTimer);
    next();
  }, 1000);
}

function finishGuide() {
  clearInterval(state.guideTimer);
  state.guideTimer = null;
  state.guideState = null;
  if (guideDialog.open) guideDialog.close();
  toast("Guía completada.");
}

function runTensionCycle() {
  const cycle = state.guideState.cycle;
  const guide = state.guideState.guide;
  runGuidePhase("Tensión", guide.tension, cycle, 660, () => {
    runGuidePhase("Pausa", guide.pause, cycle, 523, () => {
      runGuidePhase("Distensión", guide.distension, cycle, 392, () => {
        if (cycle < state.guideState.cycles) { state.guideState.cycle += 1; runTensionCycle(); return; }
        runGuidePhase("Descanso", guide.rest, cycle, 294, finishGuide);
      });
    });
  });
}

function startGuide(exercise, sets, repetitions, guide) {
  state.guideState = { sets: Math.max(1, Number.parseInt(sets, 10) || 1), set: 1, cycles: repetitionsToCycles(repetitions), cycle: 1, guide: { ...guideForExercise(exercise), ...guide } };
  guideExerciseName.textContent = exercise.name;
  guideDialog.showModal();
  runGuidePhase("Preparación", state.data.guide.preparation, 0, 523, runTensionCycle);
}

function stopGuide() {
  clearInterval(state.guideTimer);
  state.guideTimer = null;
  state.guideState = null;
  if (guideDialog.open) guideDialog.close();
}

function openVideos(exercise) {
  const videos = exercise.videos || [];
  videosExerciseName.textContent = exercise.name;
  videosList.innerHTML = videos.length ? videos.map((url, index) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Vídeo ${index + 1}</a></li>`).join("") : "<li>No hay vídeos disponibles para este ejercicio.</li>";
  videosDialog.showModal();
}

function renderPlanExercisePicker() {
  const currentExerciseId = state.data.plans[state.activeDay]?.[state.planExerciseIndex]?.exerciseId;
  const exercises = state.data.exercises.filter((exercise) => !state.planExerciseTag || exercise.tags?.includes(state.planExerciseTag));
  planExerciseTagFilter.innerHTML = `<option value="">Todos los grupos</option>${MUSCLE_TAGS.map((tag) => `<option value="${tag}" ${tag === state.planExerciseTag ? "selected" : ""}>#${tag}</option>`).join("")}`;
  planExerciseList.innerHTML = exercises.length ? exercises.map((exercise) => `<button type="button" class="plan-exercise-option ${exercise.id === currentExerciseId ? "selected" : ""}" data-action="select-plan-exercise" data-exercise-id="${exercise.id}"><strong>${escapeHtml(exercise.name)}</strong>${exercise.tags?.length ? `<div class="tag-list">${exercise.tags.map((tag) => `<span class="tag-badge">#${escapeHtml(tag)}</span>`).join("")}</div>` : ""}</button>`).join("") : `<p class="empty-state">No hay ejercicios con esta etiqueta.</p>`;
}

function openPlanExercisePicker(index) {
  state.planExerciseIndex = index;
  state.planExerciseTag = "";
  renderPlanExercisePicker();
  planExerciseDialog.showModal();
}

function openExerciseForm(exercise) {
  const details = exercise ? { ...exercise, guide: { ...exercise.guide } } : { guide: { ...DEFAULT_GUIDE_SETTINGS } };
  state.editingExerciseId = exercise?.id || null;
  form.reset();
  form.elements.name.value = exercise?.name || "";
  form.elements.muscle.value = exercise?.muscle || "";
  form.elements.summary.value = exercise?.summary || "";
  form.elements.instructions.value = listForForm(exercise?.instructions);
  EXERCISE_DETAIL_FIELDS.forEach((field) => { form.elements[field].value = details[field] || ""; });
  GUIDE_FIELDS.forEach((field) => { form.elements[`guide-${field}`].value = details.guide?.[field] || ""; });
  form.elements.errors.value = listForForm(exercise?.errors);
  form.elements.videos.value = (exercise?.videos || []).join("\n");
  form.elements.tags.innerHTML = tagsForForm();
  [...form.elements.tags.options].forEach((option) => { option.selected = details.tags?.includes(option.value); });
  document.querySelector("#exercise-dialog-title").textContent = exercise ? "Editar ejercicio" : "Nuevo ejercicio";
  document.querySelector("#exercise-submit").textContent = exercise ? "Guardar cambios" : "Añadir ejercicio";
  dialog.showModal();
}

function handleViewSwitch(event) {
  const viewButton = event.target.closest("[data-view]");
  if (!viewButton) return false;
  state.activeView = viewButton.dataset.view;
  renderApp();
  return true;
}

function handleDaySwitch(event) {
  const dayButton = event.target.closest("[data-day]");
  if (!dayButton) return false;
  state.activeDay = dayButton.dataset.day;
  renderApp();
  return true;
}

function handleWorkoutRating(event) {
  const rating = event.target.closest("[data-rating]");
  if (!rating) return false;
  const card = rating.closest("[data-workout-id]");
  const id = card.dataset.workoutId;
  const planItem = getCurrentPlan().find((item) => item.exerciseId === id);
  state.workout[id] ||= { reps: planItem.reps, resistance: planItem.resistance };
  state.workout[id].rating = rating.dataset.rating;
  renderApp();
  return true;
}

function handleGeneralAction(event) {
  const action = event.target.closest("[data-action]");
  if (!action) return false;

  const { action: type, exerciseId, historyDisplay: historyView, historyDate, planIndex } = action.dataset;

  switch (type) {
    case "new-exercise":
      openExerciseForm();
      break;
    case "edit-exercise":
      openExerciseForm(getExercise(exerciseId));
      break;
    case "close-dialog":
      dialog.close();
      break;
    case "start-guide": {
      const entry = state.workout[exerciseId] ||= {};
      const planItem = getCurrentPlan().find((item) => item.exerciseId === exerciseId);
      entry.completedSets = completedSets(entry) + 1;
      action.previousElementSibling.value = entry.completedSets;
      action.previousElementSibling.textContent = entry.completedSets;
      startGuide(getExercise(exerciseId), action.dataset.sets, action.dataset.repetitions, planItem.guide);
      break;
    }
    case "stop-guide":
      stopGuide();
      break;
    case "show-videos":
      openVideos(getExercise(exerciseId));
      break;
    case "close-videos":
      videosDialog.close();
      break;
    case "open-plan-exercise-dialog":
      openPlanExercisePicker(Number(planIndex));
      break;
    case "close-plan-exercise-dialog":
      planExerciseDialog.close();
      break;
    case "select-plan-exercise": {
      const item = state.data.plans[state.activeDay][state.planExerciseIndex];
      const exercise = getExercise(exerciseId);
      item.exerciseId = exercise.id;
      item.guide = guideForExercise(exercise);
      save();
      planExerciseDialog.close();
      renderApp();
      break;
    }
    case "backup":
      downloadBackup();
      toast("Backup descargado.");
      break;
    case "restore":
      restoreInput.click();
      break;
    case "guide-settings":
      openGuideSettings();
      break;
    case "close-guide-settings":
      guideSettingsDialog.close();
      break;
    case "set-history-display":
      state.historyDisplay = historyView;
      renderApp();
      break;
    case "history-previous-month":
      state.historyMonth = new Date(state.historyMonth.getFullYear(), state.historyMonth.getMonth() - 1, 1);
      state.selectedHistoryDate = "";
      renderApp();
      break;
    case "history-next-month":
      state.historyMonth = new Date(state.historyMonth.getFullYear(), state.historyMonth.getMonth() + 1, 1);
      state.selectedHistoryDate = "";
      renderApp();
      break;
    case "select-history-date":
      state.selectedHistoryDate = historyDate;
      renderApp();
      break;
    case "clear-tag-filter":
      state.selectedTags = [];
      renderApp();
      break;
    case "add-plan": {
      const exercise = state.data.exercises[0];
      getCurrentPlan().push({ exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(exercise) });
      save();
      renderApp();
      break;
    }
    case "remove-plan": {
      getCurrentPlan().splice(Number(action.closest("[data-plan-index]").dataset.planIndex), 1);
      save();
      renderApp();
      break;
    }
    case "finish": {
      const entries = getCurrentPlan().map((item) => {
        const exercise = getExercise(item.exerciseId);
        const entry = state.workout[exercise.id] || {};
        return { name: exercise.name, exerciseId: exercise.id, sets: completedSets(entry), reps: entry.reps || item.reps, resistance: entry.resistance || item.resistance, guide: { ...item.guide }, rating: entry.rating || "aceptable" };
      });
      state.data.history = state.data.history.filter((session) => session.day !== state.activeDay);
      const completedAt = new Date();
      state.data.history.unshift({ date: completedAt.toISOString(), weekday: completedAt.toLocaleDateString("es-ES", { weekday: "long" }), day: state.activeDay, entries });
      save();
      state.workout = {};
      toast("Sesión guardada en el historial.");
      renderApp();
      break;
    }
    case "reuse": {
      const session = sortedHistory()[Number(action.dataset.historyIndex)];
      state.data.plans[session.day] = session.entries.map((entry) => ({ exerciseId: entry.exerciseId, sets: "3", reps: entry.reps, resistance: entry.resistance, guide: { ...guideForExercise(getExercise(entry.exerciseId)), ...(entry.guide || {}) } }));
      save();
      state.activeDay = session.day;
      state.activeView = "plan";
      toast("Resultados aplicados al plan.");
      renderApp();
      break;
    }
    default:
      return false;
  }

  return true;
}

document.addEventListener("click", (event) => {
  if (handleViewSwitch(event)) return;
  if (handleDaySwitch(event)) return;
  if (handleWorkoutRating(event)) return;
  handleGeneralAction(event);
});

restoreInput.addEventListener("change", async () => {
  const [file] = restoreInput.files;
  if (file) {
    const result = await restoreBackup(file);
    if (result.ok) toast(result.message);
    else toast(result.message);
    renderApp();
  }
});

guideDialog.addEventListener("close", () => { clearInterval(state.guideTimer); state.guideTimer = null; state.guideState = null; });
planExerciseDialog.addEventListener("close", () => { state.planExerciseIndex = null; });
planExerciseTagFilter.addEventListener("change", () => { state.planExerciseTag = planExerciseTagFilter.value; renderPlanExercisePicker(); });

document.addEventListener("input", (event) => {
  const card = event.target.closest("[data-workout-id]"); if (card && event.target.dataset.record) { const entry = state.workout[card.dataset.workoutId] ||= {}; entry[event.target.dataset.record] = event.target.value; }
  const row = event.target.closest("[data-plan-index]"); if (row && event.target.dataset.plan) { state.data.plans[state.activeDay][Number(row.dataset.planIndex)][event.target.dataset.plan] = event.target.value; save(); }
  if (row && event.target.dataset.planGuide) { state.data.plans[state.activeDay][Number(row.dataset.planIndex)].guide[event.target.dataset.planGuide] = seconds(event.target.value); save(); }
  if (event.target === guideSettingsForm.elements.volume) updateVolumeLabel(event.target.value);
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.tagFilter !== undefined) { state.selectedTags = normaliseTags([...event.target.selectedOptions].map((option) => option.value)); renderApp(); return; }
  const row = event.target.closest("[data-plan-index]"); if (row && event.target.dataset.plan) { state.data.plans[state.activeDay][Number(row.dataset.planIndex)][event.target.dataset.plan] = event.target.value; save(); }
  if (event.target.dataset.setting === "day-count") {
    const previousCount = configuredDays().length;
    setDayCount(event.target.value);
    if (configuredDays().length !== previousCount) toast(`Ciclo semanal ajustado a ${configuredDays().length} días.`);
    renderApp();
  }
});

guideSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = new FormData(guideSettingsForm);
  state.data.guide = { ...state.data.guide, preparation: Number(fields.get("preparation")), volume: Number(fields.get("volume")) };
  save();
  guideSettingsDialog.close();
  toast("Ajustes de guía guardados.");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = new FormData(form);
  const exercise = { id: state.editingExerciseId || crypto.randomUUID(), name: fields.get("name").trim(), muscle: fields.get("muscle").trim(), summary: fields.get("summary").trim(), instructions: listForStorage(fields.get("instructions")), tags: normaliseTags(fields.getAll("tags")), errors: listForStorage(fields.get("errors")), videos: videosForStorage(fields.get("videos")), day: state.editingExerciseId ? getExercise(state.editingExerciseId).day : "", guide: Object.fromEntries(GUIDE_FIELDS.map((field) => [field, seconds(fields.get(`guide-${field}`))])) };
  EXERCISE_DETAIL_FIELDS.forEach((field) => { exercise[field] = fields.get(field).trim(); });
  const index = state.data.exercises.findIndex((item) => item.id === state.editingExerciseId);
  if (index === -1) state.data.exercises.push(exercise); else state.data.exercises[index] = exercise;
  save();
  form.reset();
  dialog.close();
  toast(index === -1 ? "Ejercicio añadido al catálogo." : "Cambios guardados.");
  renderApp();
});

let swRegistration = null;
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then((reg) => {
      swRegistration = reg;
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        installing?.addEventListener("statechange", () => { if (installing.state === "activated") toast("Ritmo se ha actualizado."); });
      });
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
}

document.querySelector("#update-app-btn")?.addEventListener("click", async () => {
  if (!swRegistration) { toast("Actualización no disponible."); return; }
  toast("Buscando actualizaciones…");
  try { await swRegistration.update(); } catch { toast("No se pudo comprobar actualizaciones."); }
});

initialise().then(() => renderApp()).catch(() => { app.innerHTML = `<div class="empty-state"><h2>No se pudo cargar la rutina</h2><p>Abre la aplicación desde el servidor de Docker para inicializarla.</p></div>`; });
