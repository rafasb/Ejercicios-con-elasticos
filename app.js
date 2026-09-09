const STORAGE_KEY = "ritmo-data-v1";
const ROUTINE_URL = "rutina_entrenamiento_bandas.md?v=16";
const MIN_DAYS = 3;
const MAX_DAYS = 7;
const DEFAULT_DAYS = ["DÍA 1", "DÍA 2", "DÍA 3"];
const MUSCLE_TAGS = ["Abdominal", "Biceps", "Cuadriceps", "Espalda", "Gluteo", "Hombro", "Lumbar", "Pectoral", "Triceps"];
const DEFAULT_GUIDE_SETTINGS = { preparation: 10, tension: 3, distension: 2, rest: 120, volume: .6 };
const DEFAULT_EXERCISE_GUIDE = { tension: 0, pause: 0, distension: 0, rest: 120 };
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
let activeView = "train";
let activeDay = DEFAULT_DAYS[0];
let data = { days: [...DEFAULT_DAYS], exercises: [], plans: {}, history: [], guide: { ...DEFAULT_GUIDE_SETTINGS } };
let workout = {};
let editingExerciseId = null;
let guideTimer = null;
let guideState = null;
let audioContext = null;
let historyDisplay = "list";
let historyMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedHistoryDate = "";
let selectedTags = [];
let planExerciseIndex = null;
let planExerciseTag = "";

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function createDays(count = MIN_DAYS) {
  const total = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Number.parseInt(count, 10) || MIN_DAYS));
  return Array.from({ length: total }, (_, index) => `DÍA ${index + 1}`);
}
function configuredDays() { return data.days; }
function setDayCount(count) {
  const days = createDays(count);
  configuredDays().filter((day) => !days.includes(day)).forEach((day) => delete data.plans[day]);
  days.forEach((day) => { data.plans[day] ||= []; });
  data.days = days;
  if (!days.includes(activeDay)) activeDay = days[0];
  workout = {};
  save();
}
function downloadBackup() {
  const backup = { version: 2, exportedAt: new Date().toISOString(), days: data.days, plans: data.plans, history: data.history, guide: data.guide };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ritmo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast("Backup descargado.");
}
function isValidBackup(backup) {
  const days = createDays(Array.isArray(backup?.days) ? backup.days.length : MIN_DAYS);
  return backup && typeof backup === "object" && !Array.isArray(backup) &&
    backup.plans && typeof backup.plans === "object" && !Array.isArray(backup.plans) &&
    Array.isArray(backup.history) &&
    days.every((day) => Array.isArray(backup.plans[day]));
}
async function restoreBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    if (!isValidBackup(backup)) throw new Error("invalid backup");
    data.days = createDays(Array.isArray(backup.days) ? backup.days.length : MIN_DAYS);
    data.plans = backup.plans;
    data.history = backup.history;
    if (backup.guide && typeof backup.guide === "object" && !Array.isArray(backup.guide)) data.guide = { ...DEFAULT_GUIDE_SETTINGS, ...backup.guide };
    if (!data.days.includes(activeDay)) activeDay = data.days[0];
    save();
    render();
    toast("Plan, historial y guía restaurados.");
  } catch {
    toast("El archivo no es un backup válido de Ritmo.");
  } finally {
    restoreInput.value = "";
  }
}
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
const EXERCISE_DETAIL_FIELDS = ["primaryMuscles", "secondaryMuscles", "stabilizerMuscles", "resistance", "setsAndRepetitions", "technicalNotes"];
const GUIDE_FIELDS = ["tension", "pause", "distension", "rest"];
function seconds(value) { return Math.max(0, Number.parseInt(value, 10) || 0); }
function guideForExercise(exercise) { return Object.fromEntries(GUIDE_FIELDS.map((field) => [field, exercise?.guide?.[field] === undefined ? DEFAULT_EXERCISE_GUIDE[field] : seconds(exercise.guide[field])])); }
function parseTechnicalRows(markdown = "") {
  return markdown.split("\n").filter((line) => /^\|/.test(line) && !/^\|\s*:?-+/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/\*\*/g, ""))).filter((cells) => cells.length === 2 && cells[0] !== "Parámetro");
}
function parseCadence(value = "") {
  const matches = [...value.matchAll(/(\d+)\s*segundos?/gi)].map((match) => Number(match[1]));
  if (!matches.length) return { ...DEFAULT_EXERCISE_GUIDE };
  const normalized = value.toLowerCase();
  const pause = /pausa|abajo|arriba|contracci[oó]n|apret[oó]n|rozando/.test(normalized) ? matches[1] || 0 : 0;
  return { tension: matches[0] || 0, pause, distension: matches[pause ? 2 : 1] || 0, rest: DEFAULT_EXERCISE_GUIDE.rest };
}
function exerciseFromTechnical(markdown) {
  const exercise = { primaryMuscles: "", secondaryMuscles: "", stabilizerMuscles: "", resistance: "", setsAndRepetitions: "", technicalNotes: "", guide: { ...DEFAULT_EXERCISE_GUIDE } };
  const notes = [];
  parseTechnicalRows(markdown).forEach(([term, description]) => {
    const key = term.toLowerCase();
    if (key === "músculos principales") exercise.primaryMuscles = description;
    else if (key === "músculos secundarios") exercise.secondaryMuscles = description;
    else if (key === "músculos estabilizadores") exercise.stabilizerMuscles = description;
    else if (/^resistencia/.test(key)) exercise.resistance = description;
    else if (key === "series y repeticiones") exercise.setsAndRepetitions = description;
    else if (key === "tiempo/cadencia") exercise.guide = parseCadence(description);
    else notes.push(`${term}: ${description}`);
  });
  exercise.technicalNotes = notes.join("\n");
  return exercise;
}
function normaliseExercise(exercise) {
  const legacy = exerciseFromTechnical(exercise.technical || "");
  EXERCISE_DETAIL_FIELDS.forEach((field) => { exercise[field] = typeof exercise[field] === "string" ? exercise[field] : legacy[field]; });
  exercise.guide = exercise.guide ? { ...legacy.guide, ...guideForExercise(exercise) } : legacy.guide;
  exercise.tags = normaliseTags(exercise.tags ?? exercise.hashtags);
  return exercise;
}
function exerciseTechnicalDetails(exercise) {
  const fields = [["Músculos principales", exercise.primaryMuscles], ["Músculos secundarios", exercise.secondaryMuscles], ["Músculos estabilizadores", exercise.stabilizerMuscles], ["Resistencia o peso", exercise.resistance], ["Series y repeticiones", exercise.setsAndRepetitions], ["Tiempo tensión", `${guideForExercise(exercise).tension} s`], ["Tiempo pausa", `${guideForExercise(exercise).pause} s`], ["Tiempo distensión", `${guideForExercise(exercise).distension} s`], ["Tiempo descanso entre series", `${guideForExercise(exercise).rest} s`]].filter(([label, value]) => value && !(/^Tiempo/.test(label) && value === "0 s"));
  if (exercise.technicalNotes) fields.push(["Notas técnicas", exercise.technicalNotes]);
  return fields.length ? `<dl class="technical-grid">${fields.map(([term, description]) => `<div><dt>${escapeHtml(term)}</dt><dd>${formatInline(description)}</dd></div>`).join("")}</dl>` : "";
}
function listForStorage(value) { return value.split("\n").map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean).map((line) => `- ${line}`).join("\n"); }
function listForForm(value = "") { return value.split("\n").map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean).join("\n"); }
function videosForStorage(value = "") { return value.split("\n").map((line) => line.trim()).filter((line) => /^https?:\/\//i.test(line)); }
function normaliseTag(value) {
  const clean = String(value || "").replace(/^\s*#\s*/, "").trim().toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return MUSCLE_TAGS.find((tag) => tag.toLocaleLowerCase("es-ES") === clean);
}
function normaliseTags(value = []) {
  const entries = Array.isArray(value) ? value : String(value).split(/[\n,]/);
  return [...new Set(entries.flatMap((entry) => String(entry).match(/#\s*[\p{L}]+|[^#,\n]+/gu) || []).map(normaliseTag).filter(Boolean))];
}
function tagsForForm() { return MUSCLE_TAGS.map((tag) => `<option value="${tag}">${tag}</option>`).join(""); }
function tagBadges(exercise) { return exercise.tags?.length ? `<div class="tag-list" aria-label="Etiquetas musculares">${exercise.tags.map((tag) => `<span class="tag-badge">#${escapeHtml(tag)}</span>`).join("")}</div>` : ""; }
function tagFilter() { return `<div class="tag-filter"><label for="tag-filter">Filtrar por grupos musculares</label><select id="tag-filter" data-tag-filter multiple size="4">${MUSCLE_TAGS.map((tag) => `<option value="${tag}" ${selectedTags.includes(tag) ? "selected" : ""}>#${tag}</option>`).join("")}</select><button class="text-button" data-action="clear-tag-filter" ${selectedTags.length ? "" : "disabled"}>Limpiar filtros</button></div>`; }
function matchesSelectedTags(exercise) { return selectedTags.every((tag) => exercise.tags?.includes(tag)); }
function getExercise(id) { return data.exercises.find((exercise) => exercise.id === id); }
function toast(message) { const node = document.querySelector("#toast"); node.textContent = message; node.classList.add("visible"); setTimeout(() => node.classList.remove("visible"), 2500); }
function repetitionsToCycles(value) { return Math.max(1, Number.parseInt(value, 10) || 1); }
function completedSets(entry) { return Math.max(0, Number.isFinite(entry?.completedSets) ? entry.completedSets : 0); }
function updateVolumeLabel(value) { guideVolumeValue.value = `${Math.round(Number(value) * 100)} %`; guideVolumeValue.textContent = guideVolumeValue.value; }
function openGuideSettings() {
  guideSettingsForm.elements.preparation.value = data.guide.preparation;
  guideSettingsForm.elements.volume.value = data.guide.volume;
  updateVolumeLabel(data.guide.volume);
  guideSettingsDialog.showModal();
}
function playCue(frequency) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext ||= new AudioContext();
  audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(data.guide.volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .18);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .18);
}
function updateGuide(phase, seconds, cycle) {
  guidePhase.textContent = phase;
  guideCountdown.textContent = seconds;
  guideCycle.textContent = cycle ? `Serie ${guideState.set} de ${guideState.sets} · Repetición ${cycle} de ${guideState.cycles}` : `Preparación: ${guideState.sets} series de ${guideState.cycles}`;
}
function runGuidePhase(phase, seconds, cycle, frequency, next) {
  if (seconds === 0) { next(); return; }
  clearInterval(guideTimer);
  updateGuide(phase, seconds, cycle);
  playCue(frequency);
  let remaining = seconds;
  guideTimer = setInterval(() => {
    remaining -= 1;
    updateGuide(phase, remaining, cycle);
    if (remaining !== 0) return;
    clearInterval(guideTimer);
    next();
  }, 1000);
}
function finishGuide() {
  clearInterval(guideTimer);
  guideTimer = null;
  guideState = null;
  if (guideDialog.open) guideDialog.close();
  toast("Guía completada.");
}
function runTensionCycle() {
  const cycle = guideState.cycle;
  const guide = guideState.guide;
  runGuidePhase("Tensión", guide.tension, cycle, 660, () => {
    runGuidePhase("Pausa", guide.pause, cycle, 523, () => {
      runGuidePhase("Distensión", guide.distension, cycle, 392, () => {
        if (cycle < guideState.cycles) { guideState.cycle += 1; runTensionCycle(); return; }
        runGuidePhase("Descanso", guide.rest, cycle, 294, finishGuide);
      });
    });
  });
}
function startGuide(exercise, sets, repetitions, guide) {
  guideState = { sets: Math.max(1, Number.parseInt(sets, 10) || 1), set: 1, cycles: repetitionsToCycles(repetitions), cycle: 1, guide: { ...guideForExercise(exercise), ...guide } };
  guideExerciseName.textContent = exercise.name;
  guideDialog.showModal();
  runGuidePhase("Preparación", data.guide.preparation, 0, 523, runTensionCycle);
}
function stopGuide() {
  clearInterval(guideTimer);
  guideTimer = null;
  guideState = null;
  if (guideDialog.open) guideDialog.close();
}
function openVideos(exercise) {
  const videos = exercise.videos || [];
  videosExerciseName.textContent = exercise.name;
  videosList.innerHTML = videos.length
    ? videos.map((url, index) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Vídeo ${index + 1}</a></li>`).join("")
    : "<li>No hay vídeos disponibles para este ejercicio.</li>";
  videosDialog.showModal();
}
function renderPlanExercisePicker() {
  const currentExerciseId = data.plans[activeDay]?.[planExerciseIndex]?.exerciseId;
  const exercises = data.exercises.filter((exercise) => !planExerciseTag || exercise.tags?.includes(planExerciseTag));
  planExerciseTagFilter.innerHTML = `<option value="">Todos los grupos</option>${MUSCLE_TAGS.map((tag) => `<option value="${tag}" ${tag === planExerciseTag ? "selected" : ""}>#${tag}</option>`).join("")}`;
  planExerciseList.innerHTML = exercises.length
    ? exercises.map((exercise) => `<button type="button" class="plan-exercise-option ${exercise.id === currentExerciseId ? "selected" : ""}" data-action="select-plan-exercise" data-exercise-id="${exercise.id}"><strong>${escapeHtml(exercise.name)}</strong>${tagBadges(exercise)}</button>`).join("")
    : `<p class="empty-state">No hay ejercicios con esta etiqueta.</p>`;
}
function openPlanExercisePicker(index) {
  planExerciseIndex = index;
  planExerciseTag = "";
  renderPlanExercisePicker();
  planExerciseDialog.showModal();
}
function openExerciseForm(exercise) {
  const details = exercise ? normaliseExercise(exercise) : { guide: { ...DEFAULT_EXERCISE_GUIDE } };
  editingExerciseId = exercise?.id || null;
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
    const hashtagSection = (section.match(/#### Hashtags\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1];
    const errors = (section.match(/#### Errores comunes a evitar\n([\s\S]*?)$/) || ["", ""])[1].trim();
    const videos = [...((section.match(/#### Vídeos\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1].matchAll(/https?:\/\/[^\s)>]+/g))].map(([url]) => url);
    exercises.push({ id: `seed-${exercises.length + 1}`, name: heading[1].trim(), muscle: heading[2] || "General", summary, instructions: execution, tags: normaliseTags(hashtagSection), errors, videos, day, ...exerciseFromTechnical(technical) });
  });
  return exercises;
}

async function initialise() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) { data = { ...data, ...JSON.parse(stored) }; }
  else {
    const response = await fetch(ROUTINE_URL);
    data.exercises = parseRoutine(await response.text());
    configuredDays().forEach((day) => {
      data.plans[day] = data.exercises.filter((exercise) => exercise.day === day).map((exercise) => ({ exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(exercise) }));
    });
    save();
  }
  try {
    const response = await fetch(ROUTINE_URL);
    const sourceExercises = parseRoutine(await response.text());
    let updatedExercises = false;
    data.exercises.forEach((exercise) => {
      const source = sourceExercises.find((item) => item.id === exercise.id || item.name === exercise.name);
      if (!Array.isArray(exercise.videos)) { exercise.videos = source?.videos || []; updatedExercises = true; }
      const sourceTags = source?.tags || [];
      const tags = normaliseTags(exercise.tags ?? exercise.hashtags);
      if (tags.join(",") !== sourceTags.join(",") && exercise.id.startsWith("seed-")) { exercise.tags = sourceTags; updatedExercises = true; }
    });
    if (updatedExercises) save();
  } catch {}
  data.guide = { ...DEFAULT_GUIDE_SETTINGS, ...data.guide };
  data.exercises.forEach(normaliseExercise);
  data.days = createDays(Array.isArray(data.days) ? data.days.length : MIN_DAYS);
  data.plans ||= {};
  configuredDays().forEach((day) => { data.plans[day] ||= []; });
  Object.values(data.plans).flat().forEach((item) => { item.guide = { ...guideForExercise(getExercise(item.exerciseId)), ...(item.guide || {}) }; });
  if (!configuredDays().includes(activeDay)) activeDay = configuredDays()[0];
  save();
  render();
}

function daySwitcher() { return `<div class="day-switcher">${configuredDays().map((day) => `<button class="day-button ${day === activeDay ? "active" : ""}" data-day="${day}">${day.replace("DÍA ", "Día ")}</button>`).join("")}</div>`; }
function exerciseDetails(exercise) { const details = exerciseTechnicalDetails(exercise); return `<details class="details"><summary>Ver técnica y detalles</summary><section class="detail-section"><h4>Ejecución</h4>${markdownList(exercise.instructions)}</section>${details ? `<section class="detail-section"><h4>Detalles técnicos</h4>${details}</section>` : ""}${exercise.errors ? `<section class="detail-section"><h4>Errores a evitar</h4>${markdownList(exercise.errors)}</section>` : ""}</details>`; }

function renderTrain() {
  const plan = data.plans[activeDay];
  if (!plan.length) return `${daySwitcher()}<div class="empty-state"><h2>Sesión vacía</h2><p>Añade ejercicios desde Plan para preparar este día.</p></div>`;
  return `${daySwitcher()}<div class="session-heading"><div><h2>${activeDay.replace("DÍA ", "Día ")}</h2><p>Registra cada ejercicio antes de finalizar.</p></div><span class="target">${plan.length} ejercicios</span></div><section class="exercise-list">${plan.map((item, index) => {
    const exercise = getExercise(item.exerciseId); if (!exercise) return "";
    const entry = workout[item.exerciseId] || { reps: item.reps, resistance: item.resistance, rating: "aceptable" };
    return `<article class="exercise-item" data-workout-id="${exercise.id}"><div class="exercise-title"><div><h3>${escapeHtml(exercise.name)}</h3><p>${escapeHtml(exercise.muscle)}</p></div><span class="target">${item.sets} x ${item.reps}<br>${escapeHtml(item.resistance)}</span></div><p>${escapeHtml(exercise.summary)}</p>${exerciseDetails(exercise)}<div class="record-grid"><label>Repeticiones realizadas<input type="number" min="0" inputmode="numeric" data-record="reps" value="${escapeHtml(entry.reps)}"></label><label>Resistencia / peso<input data-record="resistance" value="${escapeHtml(entry.resistance)}"></label></div><div class="exercise-actions"><output class="sets-counter" aria-label="Series realizadas">${completedSets(entry)}</output><button class="guide-play" data-action="start-guide" data-exercise-id="${exercise.id}" data-sets="${escapeHtml(item.sets)}" data-repetitions="${escapeHtml(item.reps)}" aria-label="Iniciar guía para ${escapeHtml(exercise.name)}"><span aria-hidden="true">▶</span> Guía</button><button class="outline-button" data-action="show-videos" data-exercise-id="${exercise.id}">Vídeos</button>${["fácil", "aceptable", "imposible"].map((rating) => `<button class="rating ${entry.rating === rating ? "selected" : ""}" data-rating="${rating}">${rating}</button>`).join("")}</div></article>`;
  }).join("")}</section><button class="primary-button sticky-action" data-action="finish">Finalizar ${activeDay.replace("DÍA ", "Día ")}</button>`;
}

function guideInputs(item) {
  const guide = item.guide || {};
  return `<div class="plan-guide"><label>Tensión (s)<input data-plan-guide="tension" type="number" min="0" inputmode="numeric" value="${seconds(guide.tension)}"></label><label>Pausa (s)<input data-plan-guide="pause" type="number" min="0" inputmode="numeric" value="${seconds(guide.pause)}"></label><label>Distensión (s)<input data-plan-guide="distension" type="number" min="0" inputmode="numeric" value="${seconds(guide.distension)}"></label><label>Descanso (s)<input data-plan-guide="rest" type="number" min="0" inputmode="numeric" value="${seconds(guide.rest)}"></label></div>`;
}
function tagSummary(items, label) {
  const counts = new Map();
  items.forEach((item) => getExercise(item.exerciseId)?.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  return counts.size ? `<section class="tag-summary" aria-label="${label}"><h3>${label}</h3><p>${[...counts].map(([tag, count]) => `<span>#${tag}: ${count}</span>`).join(" | ")}</p></section>` : "";
}
function renderPlan() {
  const plan = data.plans[activeDay];
  return `<section class="cycle-settings" aria-labelledby="cycle-settings-title"><div><h2 id="cycle-settings-title">Ciclo semanal</h2><p>Configura los días que quieres entrenar cada semana.</p></div><label>Días de entrenamiento<input type="number" min="${MIN_DAYS}" max="${MAX_DAYS}" value="${configuredDays().length}" inputmode="numeric" data-setting="day-count"></label></section>${tagSummary(Object.values(data.plans).flat(), "Resumen muscular semanal")}${daySwitcher()}<div class="session-heading"><div><h2>Planificar ${activeDay.replace("DÍA ", "Día ")}</h2><p>Ajusta el objetivo de tu siguiente sesión.</p></div></div>${tagSummary(plan, `Resumen muscular de ${activeDay.replace("DÍA ", "Día ")}`)}<section>${plan.map((item, index) => { const exercise = getExercise(item.exerciseId); return `<div class="plan-row" data-plan-index="${index}"><div class="plan-exercise-field"><span>Ejercicio</span><button type="button" class="plan-exercise-picker" data-action="open-plan-exercise-dialog" data-plan-index="${index}" aria-haspopup="dialog">${escapeHtml(exercise.name)}${tagBadges(exercise)}</button></div><label>Series<input data-plan="sets" type="number" min="1" value="${escapeHtml(item.sets)}"></label><label class="plan-repetitions">Repeticiones<input data-plan="reps" type="text" value="${escapeHtml(item.reps)}" aria-label="Repeticiones objetivo"></label><label class="plan-resistance">Peso o fuerza<input data-plan="resistance" type="text" value="${escapeHtml(item.resistance)}" aria-label="Peso o fuerza"></label>${guideInputs(item)}<button class="remove-button" data-action="remove-plan" aria-label="Eliminar ejercicio">×</button></div>`; }).join("")}</section><div class="action-row"><button class="outline-button" data-action="add-plan">+ Añadir ejercicio</button></div>`;
}

function sortedHistory() { return [...data.history].sort((first, second) => (Date.parse(second.date) || 0) - (Date.parse(first.date) || 0)); }
function historyDateKey(session) {
  const date = new Date(session.date);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function historyDayLabel(dateKey) { return new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }); }
function renderHistorySession(session, index) {
  return `<article class="history-item"><div class="exercise-title"><div><h3>${session.day.replace("DÍA ", "Día ")}</h3><p class="history-meta">${escapeHtml(session.weekday || new Date(session.date).toLocaleDateString("es-ES", { weekday: "long" }))} · ${new Date(session.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p></div><button class="outline-button" data-action="reuse" data-history-index="${index}">Usar en plan</button></div>${session.entries.map((entry) => `<div class="result-line"><span>${escapeHtml(entry.name)}</span><span>${entry.sets ?? 0} series · ${escapeHtml(entry.reps)} reps · ${escapeHtml(entry.resistance)} <b class="badge" data-rating="${escapeHtml(entry.rating)}">${escapeHtml(entry.rating)}</b></span></div>`).join("")}</article>`;
}
function historyToggle() {
  return `<div class="history-toggle" role="group" aria-label="Vista del historial"><button class="${historyDisplay === "list" ? "active" : ""}" data-action="set-history-display" data-history-display="list" aria-pressed="${historyDisplay === "list"}">Lista</button><button class="${historyDisplay === "calendar" ? "active" : ""}" data-action="set-history-display" data-history-display="calendar" aria-pressed="${historyDisplay === "calendar"}">Calendario</button></div>`;
}
function renderHistoryCalendar(sessions) {
  const year = historyMonth.getFullYear();
  const month = historyMonth.getMonth();
  const sessionsByDate = new Map();
  sessions.forEach((session, index) => {
    const key = historyDateKey(session);
    if (key) sessionsByDate.set(key, [...(sessionsByDate.get(key) || []), { session, index }]);
  });
  const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(historyMonth);
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();
  const cells = Array.from({ length: leadingDays + daysInMonth }, (_, index) => {
    if (index < leadingDays) return `<span class="calendar-day empty" aria-hidden="true"></span>`;
    const day = index - leadingDays + 1;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const records = sessionsByDate.get(key) || [];
    const selected = key === selectedHistoryDate;
    return `<button class="calendar-day ${records.length ? "has-records" : ""} ${selected ? "selected" : ""}" data-action="select-history-date" data-history-date="${key}" ${records.length ? `aria-label="${day}, ${records.length} registro${records.length === 1 ? "" : "s"}"` : `aria-label="${day}, sin registros"`} ${records.length ? "" : "disabled"}><span>${day}</span>${records.length ? `<b>${records.length}</b>` : ""}</button>`;
  }).join("");
  const selectedSessions = sessionsByDate.get(selectedHistoryDate) || [];
  return `<section class="history-calendar" aria-label="Calendario de entrenamientos"><div class="calendar-header"><button class="icon-button" data-action="history-previous-month" aria-label="Mes anterior">&lsaquo;</button><h3>${monthLabel}</h3><button class="icon-button" data-action="history-next-month" aria-label="Mes siguiente" ${isCurrentMonth ? "disabled" : ""}>&rsaquo;</button></div><div class="calendar-weekdays" aria-hidden="true"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="calendar-grid">${cells}</div></section>${selectedSessions.length ? `<section class="history-day-details" aria-live="polite"><h3>${historyDayLabel(selectedHistoryDate)}</h3>${selectedSessions.map(({ session, index }) => renderHistorySession(session, index)).join("")}</section>` : `<p class="calendar-hint">Selecciona un día marcado para consultar sus resultados.</p>`}`;
}
function renderHistory() {
  const sessions = sortedHistory();
  const heading = `<div class="session-heading"><div><h2>Historial</h2><p>Usa una sesión como punto de partida para el próximo ciclo.</p></div></div>${historyToggle()}`;
  if (!sessions.length) return `${heading}<div class="empty-state"><h2>Aún no hay sesiones</h2><p>Al finalizar un entrenamiento, sus resultados aparecerán aquí.</p></div>`;
  return `${heading}${historyDisplay === "calendar" ? renderHistoryCalendar(sessions) : sessions.map(renderHistorySession).join("")}`;
}

function renderExercises() { const filteredExercises = data.exercises.filter(matchesSelectedTags); return `<div class="exercise-tools"><button class="outline-button" data-action="backup">Backup</button><button class="outline-button" data-action="restore">Restore</button><button class="outline-button" data-action="guide-settings">Ajustar guía</button></div><div class="session-heading"><div><h2>Ejercicios</h2><p>${filteredExercises.length} de ${data.exercises.length} disponibles en tu catálogo.</p></div><button class="primary-button" data-action="new-exercise">Añadir</button></div>${tagFilter()}${filteredExercises.map((exercise) => `<article class="catalogue-card"><div class="catalogue-heading"><div><h3>${escapeHtml(exercise.name)}</h3><p>${escapeHtml(exercise.muscle)} · ${escapeHtml(exercise.summary)}</p>${tagBadges(exercise)}</div><div class="heading-actions"><button class="outline-button" data-action="show-videos" data-exercise-id="${exercise.id}">Vídeos</button><button class="outline-button" data-action="edit-exercise" data-exercise-id="${exercise.id}">Editar</button></div></div>${exerciseDetails(exercise)}</article>`).join("") || `<div class="empty-state"><h2>Sin coincidencias</h2><p>Prueba a quitar alguna etiqueta del filtro.</p></div>`}`; }
function render() {
  const views = { train: renderTrain, plan: renderPlan, history: renderHistory, exercises: renderExercises };
  app.innerHTML = views[activeView]();
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === activeView));
  document.querySelector("#header-copy").textContent = ({ train: "Tu ciclo semanal, listo para moverse.", plan: "Define objetivos claros para cada sesión.", history: "Mira lo que hiciste y ajusta el rumbo.", exercises: "Técnica antes que velocidad." })[activeView];
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]"); if (viewButton) { activeView = viewButton.dataset.view; render(); return; }
  const dayButton = event.target.closest("[data-day]"); if (dayButton) { activeDay = dayButton.dataset.day; render(); return; }
  const rating = event.target.closest("[data-rating]"); if (rating) { const card = rating.closest("[data-workout-id]"); const id = card.dataset.workoutId; const planItem = data.plans[activeDay].find((item) => item.exerciseId === id); workout[id] ||= { reps: planItem.reps, resistance: planItem.resistance }; workout[id].rating = rating.dataset.rating; render(); return; }
  const action = event.target.closest("[data-action]"); if (!action) return;
  if (action.dataset.action === "new-exercise") openExerciseForm();
  if (action.dataset.action === "edit-exercise") openExerciseForm(getExercise(action.dataset.exerciseId));
  if (action.dataset.action === "close-dialog") dialog.close();
  if (action.dataset.action === "start-guide") {
    const entry = workout[action.dataset.exerciseId] ||= {};
    const planItem = data.plans[activeDay].find((item) => item.exerciseId === action.dataset.exerciseId);
    entry.completedSets = completedSets(entry) + 1;
    action.previousElementSibling.value = entry.completedSets;
    action.previousElementSibling.textContent = entry.completedSets;
    startGuide(getExercise(action.dataset.exerciseId), action.dataset.sets, action.dataset.repetitions, planItem.guide);
  }
  if (action.dataset.action === "stop-guide") stopGuide();
  if (action.dataset.action === "show-videos") openVideos(getExercise(action.dataset.exerciseId));
  if (action.dataset.action === "close-videos") videosDialog.close();
  if (action.dataset.action === "open-plan-exercise-dialog") openPlanExercisePicker(Number(action.dataset.planIndex));
  if (action.dataset.action === "close-plan-exercise-dialog") planExerciseDialog.close();
  if (action.dataset.action === "select-plan-exercise") {
    const item = data.plans[activeDay][planExerciseIndex];
    const exercise = getExercise(action.dataset.exerciseId);
    item.exerciseId = exercise.id;
    item.guide = guideForExercise(exercise);
    save(); planExerciseDialog.close(); render();
  }
  if (action.dataset.action === "backup") downloadBackup();
  if (action.dataset.action === "restore") restoreInput.click();
  if (action.dataset.action === "guide-settings") openGuideSettings();
  if (action.dataset.action === "close-guide-settings") guideSettingsDialog.close();
  if (action.dataset.action === "set-history-display") { historyDisplay = action.dataset.historyDisplay; render(); }
  if (action.dataset.action === "history-previous-month") { historyMonth = new Date(historyMonth.getFullYear(), historyMonth.getMonth() - 1, 1); selectedHistoryDate = ""; render(); }
  if (action.dataset.action === "history-next-month") { historyMonth = new Date(historyMonth.getFullYear(), historyMonth.getMonth() + 1, 1); selectedHistoryDate = ""; render(); }
  if (action.dataset.action === "select-history-date") { selectedHistoryDate = action.dataset.historyDate; render(); }
  if (action.dataset.action === "clear-tag-filter") { selectedTags = []; render(); }
  if (action.dataset.action === "add-plan") { const exercise = data.exercises[0]; data.plans[activeDay].push({ exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(exercise) }); save(); render(); }
  if (action.dataset.action === "remove-plan") { data.plans[activeDay].splice(Number(action.closest("[data-plan-index]").dataset.planIndex), 1); save(); render(); }
  if (action.dataset.action === "finish") {
    const entries = data.plans[activeDay].map((item) => { const exercise = getExercise(item.exerciseId); const entry = workout[exercise.id] || {}; return { name: exercise.name, exerciseId: exercise.id, sets: completedSets(entry), reps: entry.reps || item.reps, resistance: entry.resistance || item.resistance, guide: { ...item.guide }, rating: entry.rating || "aceptable" }; });
    data.history = data.history.filter((session) => session.day !== activeDay);
    const completedAt = new Date();
    data.history.unshift({ date: completedAt.toISOString(), weekday: completedAt.toLocaleDateString("es-ES", { weekday: "long" }), day: activeDay, entries }); save(); workout = {}; toast("Sesión guardada en el historial."); render();
  }
  if (action.dataset.action === "reuse") { const session = sortedHistory()[Number(action.dataset.historyIndex)]; data.plans[session.day] = session.entries.map((entry) => ({ exerciseId: entry.exerciseId, sets: "3", reps: entry.reps, resistance: entry.resistance, guide: { ...guideForExercise(getExercise(entry.exerciseId)), ...(entry.guide || {}) } })); save(); activeDay = session.day; activeView = "plan"; toast("Resultados aplicados al plan."); render(); }
});

restoreInput.addEventListener("change", () => {
  const [file] = restoreInput.files;
  if (file) restoreBackup(file);
});

guideDialog.addEventListener("close", () => { clearInterval(guideTimer); guideTimer = null; guideState = null; });
planExerciseDialog.addEventListener("close", () => { planExerciseIndex = null; });
planExerciseTagFilter.addEventListener("change", () => { planExerciseTag = planExerciseTagFilter.value; renderPlanExercisePicker(); });

document.addEventListener("input", (event) => {
  const card = event.target.closest("[data-workout-id]"); if (card && event.target.dataset.record) { const entry = workout[card.dataset.workoutId] ||= {}; entry[event.target.dataset.record] = event.target.value; }
  const row = event.target.closest("[data-plan-index]"); if (row && event.target.dataset.plan) { data.plans[activeDay][Number(row.dataset.planIndex)][event.target.dataset.plan] = event.target.value; save(); }
  if (row && event.target.dataset.planGuide) { data.plans[activeDay][Number(row.dataset.planIndex)].guide[event.target.dataset.planGuide] = seconds(event.target.value); save(); }
  if (event.target === guideSettingsForm.elements.volume) updateVolumeLabel(event.target.value);
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.tagFilter !== undefined) { selectedTags = normaliseTags([...event.target.selectedOptions].map((option) => option.value)); render(); return; }
  const row = event.target.closest("[data-plan-index]");
  if (event.target.dataset.setting !== "day-count") return;
  const previousCount = configuredDays().length;
  setDayCount(event.target.value);
  if (configuredDays().length !== previousCount) toast(`Ciclo semanal ajustado a ${configuredDays().length} días.`);
  render();
});

guideSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = new FormData(guideSettingsForm);
  data.guide = { ...data.guide, preparation: Number(fields.get("preparation")), volume: Number(fields.get("volume")) };
  save(); guideSettingsDialog.close(); toast("Ajustes de guía guardados.");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = new FormData(form);
  const exercise = { id: editingExerciseId || uid(), name: fields.get("name").trim(), muscle: fields.get("muscle").trim(), summary: fields.get("summary").trim(), instructions: listForStorage(fields.get("instructions")), tags: normaliseTags(fields.getAll("tags")), errors: listForStorage(fields.get("errors")), videos: videosForStorage(fields.get("videos")), day: editingExerciseId ? getExercise(editingExerciseId).day : "", guide: Object.fromEntries(GUIDE_FIELDS.map((field) => [field, seconds(fields.get(`guide-${field}`))])) };
  EXERCISE_DETAIL_FIELDS.forEach((field) => { exercise[field] = fields.get(field).trim(); });
  const index = data.exercises.findIndex((item) => item.id === editingExerciseId);
  if (index === -1) data.exercises.push(exercise); else data.exercises[index] = exercise;
  save(); form.reset(); dialog.close(); toast(index === -1 ? "Ejercicio añadido al catálogo." : "Cambios guardados."); render();
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
initialise().catch(() => { app.innerHTML = `<div class="empty-state"><h2>No se pudo cargar la rutina</h2><p>Abre la aplicación desde el servidor de Docker para inicializarla.</p></div>`; });