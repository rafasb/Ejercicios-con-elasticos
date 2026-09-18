import { DEFAULT_DAYS, DEFAULT_GUIDE_SETTINGS, MAX_DAYS, MIN_DAYS, ROUTINE_JSON_URL, ROUTINE_URL, STORAGE_KEY } from "./constants.js";
import { guideForExercise, normaliseExercise, normaliseTags, parseRoutine, validateRoutineData, videosForStorage } from "./utils.js";

export const state = {
  activeView: "train",
  activeDay: DEFAULT_DAYS[0],
  data: { days: [...DEFAULT_DAYS], exercises: [], plans: {}, history: [], guide: { ...DEFAULT_GUIDE_SETTINGS } },
  workout: {},
  editingExerciseId: null,
  guideTimer: null,
  guideState: null,
  audioContext: null,
  historyDisplay: "list",
  historyMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedHistoryDate: "",
  selectedTags: [],
  planExerciseIndex: null,
  planExerciseTag: "",
  routineError: null,
  storageWarning: null
};

export function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

export function createDays(count = MIN_DAYS) {
  const total = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Number.parseInt(count, 10) || MIN_DAYS));
  return Array.from({ length: total }, (_, index) => `DÍA ${index + 1}`);
}

export function configuredDays() {
  return state.data.days;
}

export function getExercise(id) {
  return state.data.exercises.find((exercise) => exercise.id === id);
}

export function cloneSeedToUser(seedId) {
  const seed = state.data.exercises.find((exercise) => exercise.id === seedId);
  if (!seed || !seed.id.startsWith("seed-")) return null;
  const clone = { ...seed, tags: normaliseTags(seed.tags), guide: { ...seed.guide }, videos: [...(seed.videos || [])], id: `user-${crypto.randomUUID()}`, parentSeedId: seed.id, candidateForCanon: false };
  state.data.exercises.push(clone);
  save();
  return clone;
}

export function toggleCandidateForCanon(userId) {
  const exercise = state.data.exercises.find((item) => item.id === userId);
  if (!exercise || !exercise.id.startsWith("user-")) return false;
  exercise.candidateForCanon = !exercise.candidateForCanon;
  save();
  return exercise.candidateForCanon;
}

export function getCurrentPlan() {
  return state.data.plans[state.activeDay] || [];
}

export function setDayCount(count) {
  const days = createDays(count);
  for (const day of configuredDays().filter((day) => !days.includes(day))) delete state.data.plans[day];
  for (const day of days) { state.data.plans[day] ||= []; }
  state.data.days = days;
  if (!days.includes(state.activeDay)) state.activeDay = days[0];
  state.workout = {};
  save();
}

function planItemForExercise(exercise, existingItems) {
  return existingItems.get(exercise.id) || { exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(exercise) };
}

async function loadRoutineExercises(suffix = "") {
  try {
    const response = await fetch(`${ROUTINE_JSON_URL}${suffix}`);
    if (!response.ok) throw new Error(`JSON ${response.status}`);
    return { exercises: validateRoutineData(await response.json()), fallback: false };
  } catch (jsonError) {
    const response = await fetch(`${ROUTINE_URL}${suffix}`);
    return { exercises: parseRoutine(await response.text()), fallback: true, cause: jsonError };
  }
}

export function applyPreset(dayCount) {
  const total = Number.parseInt(dayCount, 10);
  if (!Number.isFinite(total) || total < MIN_DAYS || total > MAX_DAYS) return { ok: false, message: `No se pudo aplicar la preconfiguración: elige entre ${MIN_DAYS} y ${MAX_DAYS} días.` };
  const catalog = state.data.exercises.filter((exercise) => exercise && typeof exercise.id === "string" && (exercise.id.startsWith("seed-") || exercise.id.startsWith("user-")) && typeof exercise.name === "string" && exercise.name.trim() !== "");
  if (catalog.length < total) return { ok: false, message: `No se pudo aplicar la preconfiguración: hay ${catalog.length} ejercicios para ${total} días. Añade ejercicios primero.` };

  const existingItems = new Map(Object.values(state.data.plans).flat().map((item) => [item.exerciseId, item]));
  const groups = Array.from({ length: total }, () => []);
  catalog.forEach((exercise, index) => { groups[index % total].push(exercise); });

  state.data.days = createDays(total);
  state.data.plans = Object.fromEntries(groups.map((group, index) => [`DÍA ${index + 1}`, group.map((exercise) => planItemForExercise(exercise, existingItems))]));
  state.activeDay = state.data.days[0];
  state.workout = {};
  save();
  return { ok: true, message: `Preconfiguración de ${total} días aplicada con ${catalog.length} ejercicios.` };
}

export function downloadBackup() {
  const customs = state.data.exercises.filter((exercise) => !exercise.id.startsWith("seed-"));
  const backup = { version: 3, exportedAt: new Date().toISOString(), days: state.data.days, plans: state.data.plans, history: state.data.history, guide: state.data.guide, exercises: customs };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ritmo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function isValidBackup(backup) {
  if (!backup || typeof backup !== "object" || Array.isArray(backup)) return false;
  if (backup.version !== undefined && backup.version !== 2 && backup.version !== 3) return false;
  if (!backup.plans || typeof backup.plans !== "object" || Array.isArray(backup.plans)) return false;
  if (!Array.isArray(backup.history)) return false;
  if (!Array.isArray(backup.days) || backup.days.length < MIN_DAYS || backup.days.length > MAX_DAYS || !backup.days.every((day, index) => day === `DÍA ${index + 1}`)) return false;
  const days = createDays(backup.days.length);
  if (!days.every((day) => Array.isArray(backup.plans[day]))) return false;
  if (backup.version === 3) {
    if (!Array.isArray(backup.exercises)) return false;
    if (!backup.exercises.every((exercise) => exercise && typeof exercise.id === "string" && !exercise.id.startsWith("seed-") && typeof exercise.name === "string" && exercise.name.trim() !== "")) return false;
  }
  return true;
}

export async function restoreBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    if (!isValidBackup(backup)) throw new Error("invalid backup");
    state.data.days = createDays(Array.isArray(backup.days) ? backup.days.length : MIN_DAYS);
    state.data.plans = backup.plans;
    state.data.history = backup.history;
    if (backup.guide && typeof backup.guide === "object" && !Array.isArray(backup.guide)) state.data.guide = { ...DEFAULT_GUIDE_SETTINGS, ...backup.guide };
    if (backup.version === 3 && Array.isArray(backup.exercises)) {
      const seeds = state.data.exercises.filter((exercise) => exercise.id.startsWith("seed-"));
      const customs = backup.exercises
        .filter((exercise) => exercise && typeof exercise.id === "string" && !exercise.id.startsWith("seed-") && typeof exercise.name === "string" && exercise.name.trim() !== "")
        .map((exercise) => {
          const tags = normaliseTags(exercise.tags ?? exercise.hashtags ?? []);
          const videosValue = Array.isArray(exercise.videos) ? exercise.videos.join("\n") : String(exercise.videos ?? "");
          const videos = videosForStorage(videosValue);
          const parentSeedId = typeof exercise.parentSeedId === "string" && exercise.parentSeedId.startsWith("seed-") && seeds.some((seed) => seed.id === exercise.parentSeedId) ? exercise.parentSeedId : undefined;
          const candidateForCanon = exercise.id.startsWith("user-") ? Boolean(exercise.candidateForCanon) : false;
          const base = { ...exercise, name: exercise.name.trim(), tags, videos, candidateForCanon };
          if (parentSeedId) base.parentSeedId = parentSeedId; else delete base.parentSeedId;
          if (!exercise.id.startsWith("user-")) delete base.candidateForCanon;
          return base;
        });
      state.data.exercises = [...seeds, ...customs];
      if (!state.data.days.includes(state.activeDay)) state.activeDay = state.data.days[0];
      save();
      const count = customs.length;
      return { ok: true, message: count ? `Plan, historial, guía y ${count} ejercicio${count === 1 ? "" : "s"} personalizado${count === 1 ? "" : "s"} restaurado${count === 1 ? "" : "s"}.` : "Plan, historial, guía y ejercicios personalizados restaurados (sin personalizados en backup)." };
    }
    if (!state.data.days.includes(state.activeDay)) state.activeDay = state.data.days[0];
    save();
    return { ok: true, message: "Plan, historial y guía restaurados (backup sin ejercicios personalizados, compatibilidad v2)." };
  } catch {
    return { ok: false, message: "El archivo no es un backup válido de Ritmo." };
  } finally {
    const input = document.querySelector("#restore-input");
    if (input) input.value = "";
  }
}

export async function initialise({ forceRoutineSync = false } = {}) {
  const stored = localStorage.getItem(STORAGE_KEY);
  // M4: guardia localStorage corrupto. Ver /project/mejoras.md#M4 y /memory/decisiones.md.
  let needsSeed = !stored;
  state.storageWarning = null;
  if (stored) {
    try {
      state.data = { ...state.data, ...JSON.parse(stored) };
    } catch {
      const corruptKey = `ritmo-data-corrupt-${Date.now()}`;
      try {
        localStorage.setItem(corruptKey, stored);
      } catch {}
      localStorage.removeItem(STORAGE_KEY);
      state.data = { days: [...DEFAULT_DAYS], exercises: [], plans: {}, history: [], guide: { ...DEFAULT_GUIDE_SETTINGS } };
      needsSeed = true;
      state.storageWarning = "Tus datos guardados estaban dañados: hemos guardado una copia de seguridad y hemos restablecido tu rutina.";
      console.warn(`Datos locales corruptos: se guardó una copia en ${corruptKey} y se restableció Ritmo.`);
      if (typeof document !== "undefined") {
        const toastNode = document.querySelector("#toast");
        if (toastNode) {
          toastNode.textContent = state.storageWarning;
          toastNode.classList.add("visible");
          setTimeout(() => toastNode.classList.remove("visible"), 2500);
        }
      }
    }
  }
  if (needsSeed) {
    const { exercises, fallback } = await loadRoutineExercises();
    state.data.exercises = exercises;
    for (const day of configuredDays()) {
      state.data.plans[day] = state.data.exercises.filter((exercise) => exercise.day === day).map((exercise) => ({ exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(exercise) }));
    }
    if (fallback) state.routineError = "Rutina JSON no disponible: se cargó la versión clásica. Revisa tu conexión y pulsa Actualizar.";
    save();
  }

  try {
    const { exercises: sourceExercises, fallback } = await loadRoutineExercises(forceRoutineSync ? `?sync=${Date.now()}` : "");
    let updatedExercises = false;
    const seedExercises = state.data.exercises.filter((exercise) => exercise.id.startsWith("seed-"));
    const highestSeedId = seedExercises.reduce((highest, exercise) => Math.max(highest, Number(exercise.id.slice(5)) || 0), 0);
    let nextSeedId = highestSeedId + 1;
    for (const source of sourceExercises) {
      const exercise = state.data.exercises.find((item) => item.id === source.id);
      if (exercise?.id.startsWith("seed-")) {
        const index = state.data.exercises.indexOf(exercise);
        state.data.exercises[index] = { ...source, id: exercise.id };
        updatedExercises = true;
        continue;
      }
      const newExercise = { ...source, id: `seed-${nextSeedId++}` };
      state.data.exercises.push(newExercise);
      if (state.data.plans[source.day]) state.data.plans[source.day].push({ exerciseId: newExercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(newExercise) });
      updatedExercises = true;
    }
    if (updatedExercises) save();
    state.routineError = fallback ? "Rutina JSON no disponible: se usó la versión clásica. Revisa tu conexión y pulsa Actualizar." : null;
  } catch (error) {
    state.routineError = "No se pudo actualizar la rutina: revisa tu conexión y pulsa Actualizar. Se conservan los ejercicios actuales.";
    console.warn(state.routineError, error);
  }

  state.data.guide = { ...DEFAULT_GUIDE_SETTINGS, ...state.data.guide };
  for (const exercise of state.data.exercises) { normaliseExercise(exercise); }
  state.data.days = createDays(Array.isArray(state.data.days) ? state.data.days.length : MIN_DAYS);
  state.data.plans ||= {};
  for (const day of configuredDays()) { state.data.plans[day] ||= []; }
  for (const item of Object.values(state.data.plans).flat()) { item.guide = { ...guideForExercise(getExercise(item.exerciseId)), ...(item.guide || {}) }; }
  if (!configuredDays().includes(state.activeDay)) state.activeDay = configuredDays()[0];
  save();
}

export function sortedHistory() {
  return [...state.data.history].sort((first, second) => (Date.parse(second.date) || 0) - (Date.parse(first.date) || 0));
}

export function getHistoryDateKey(session) {
  const date = new Date(session.date);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function historyDayLabel(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}
