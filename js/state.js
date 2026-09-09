import { DEFAULT_DAYS, DEFAULT_GUIDE_SETTINGS, MAX_DAYS, MIN_DAYS, ROUTINE_URL, STORAGE_KEY } from "./constants.js";
import { guideForExercise, normaliseExercise, parseRoutine } from "./utils.js";

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
  planExerciseTag: ""
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

export function getCurrentPlan() {
  return state.data.plans[state.activeDay] || [];
}

export function setDayCount(count) {
  const days = createDays(count);
  configuredDays().filter((day) => !days.includes(day)).forEach((day) => delete state.data.plans[day]);
  days.forEach((day) => { state.data.plans[day] ||= []; });
  state.data.days = days;
  if (!days.includes(state.activeDay)) state.activeDay = days[0];
  state.workout = {};
  save();
}

export function downloadBackup() {
  const backup = { version: 2, exportedAt: new Date().toISOString(), days: state.data.days, plans: state.data.plans, history: state.data.history, guide: state.data.guide };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ritmo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function isValidBackup(backup) {
  const days = createDays(Array.isArray(backup?.days) ? backup.days.length : MIN_DAYS);
  return backup && typeof backup === "object" && !Array.isArray(backup) &&
    backup.plans && typeof backup.plans === "object" && !Array.isArray(backup.plans) &&
    Array.isArray(backup.history) &&
    days.every((day) => Array.isArray(backup.plans[day]));
}

export async function restoreBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    if (!isValidBackup(backup)) throw new Error("invalid backup");
    state.data.days = createDays(Array.isArray(backup.days) ? backup.days.length : MIN_DAYS);
    state.data.plans = backup.plans;
    state.data.history = backup.history;
    if (backup.guide && typeof backup.guide === "object" && !Array.isArray(backup.guide)) state.data.guide = { ...DEFAULT_GUIDE_SETTINGS, ...backup.guide };
    if (!state.data.days.includes(state.activeDay)) state.activeDay = state.data.days[0];
    save();
    return { ok: true, message: "Plan, historial y guía restaurados." };
  } catch {
    return { ok: false, message: "El archivo no es un backup válido de Ritmo." };
  } finally {
    const input = document.querySelector("#restore-input");
    if (input) input.value = "";
  }
}

export async function initialise() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    state.data = { ...state.data, ...JSON.parse(stored) };
  } else {
    const response = await fetch(ROUTINE_URL);
    state.data.exercises = parseRoutine(await response.text());
    configuredDays().forEach((day) => {
      state.data.plans[day] = state.data.exercises.filter((exercise) => exercise.day === day).map((exercise) => ({ exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(exercise) }));
    });
    save();
  }

  try {
    const response = await fetch(ROUTINE_URL);
    const sourceExercises = parseRoutine(await response.text());
    let updatedExercises = false;
    state.data.exercises.forEach((exercise) => {
      const source = sourceExercises.find((item) => item.id === exercise.id || item.name === exercise.name);
      if (!Array.isArray(exercise.videos)) { exercise.videos = source?.videos || []; updatedExercises = true; }
      const sourceTags = source?.tags || [];
      const tags = normaliseExercise({ ...exercise }).tags;
      if (tags.join(",") !== sourceTags.join(",") && exercise.id.startsWith("seed-")) { exercise.tags = sourceTags; updatedExercises = true; }
    });
    if (updatedExercises) save();
  } catch {}

  state.data.guide = { ...DEFAULT_GUIDE_SETTINGS, ...state.data.guide };
  state.data.exercises.forEach((exercise) => normaliseExercise(exercise));
  state.data.days = createDays(Array.isArray(state.data.days) ? state.data.days.length : MIN_DAYS);
  state.data.plans ||= {};
  configuredDays().forEach((day) => { state.data.plans[day] ||= []; });
  Object.values(state.data.plans).flat().forEach((item) => { item.guide = { ...guideForExercise(getExercise(item.exerciseId)), ...(item.guide || {}) }; });
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
