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

function planItemForExercise(exercise, existingItems) {
  return existingItems.get(exercise.id) || { exerciseId: exercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(exercise) };
}

function compatibleGroups(first, second) {
  return ![...first.tags].some((tag) => second.tags.has(tag));
}

function sixDayGroups(exercises) {
  const groups = [];
  for (let first = 0; first < exercises.length; first += 1) {
    for (let second = first + 1; second < exercises.length; second += 1) {
      for (let third = second + 1; third < exercises.length; third += 1) {
        const indexes = [first, second, third];
        groups.push({ indexes, tags: new Set(indexes.flatMap((index) => exercises[index].tags || [])) });
      }
    }
  }

  function search(path, used) {
    if (path.length === 6) return used.size === exercises.length && compatibleGroups(path[5], path[0]) ? path : null;
    for (const group of groups) {
      if (group.indexes.some((index) => used.has(index))) continue;
      if (path.length && !compatibleGroups(path[path.length - 1], group)) continue;
      const nextUsed = new Set(used);
      group.indexes.forEach((index) => nextUsed.add(index));
      const result = search([...path, group], nextUsed);
      if (result) return result;
    }
    return null;
  }

  return search([], new Set());
}

export function applyPreset(dayCount) {
  const routineExercises = state.data.exercises.filter((exercise) => /^DÍA [1-3]$/.test(exercise.day));
  if (routineExercises.length !== 18) return false;

  const existingItems = new Map(Object.values(state.data.plans).flat().map((item) => [item.exerciseId, item]));
  const presetDays = dayCount === 6 ? 6 : 3;
  const groups = presetDays === 6 ? sixDayGroups(routineExercises) : [1, 2, 3].map((day) => routineExercises.filter((exercise) => exercise.day === `DÍA ${day}`));
  if (!groups || groups.some((group) => !(group.indexes ? group.indexes.length : group.length))) return false;

  state.data.days = createDays(presetDays);
  state.data.plans = Object.fromEntries(groups.map((group, index) => {
    const exercises = group.indexes ? group.indexes.map((exerciseIndex) => routineExercises[exerciseIndex]) : group;
    return [`DÍA ${index + 1}`, exercises.map((exercise) => planItemForExercise(exercise, existingItems))];
  }));
  state.activeDay = state.data.days[0];
  state.workout = {};
  save();
  return true;
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

export async function initialise({ forceRoutineSync = false } = {}) {
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
    const response = await fetch(forceRoutineSync ? `${ROUTINE_URL}?sync=${Date.now()}` : ROUTINE_URL);
    const sourceExercises = parseRoutine(await response.text());
    let updatedExercises = false;
    const seedExercises = state.data.exercises.filter((exercise) => exercise.id.startsWith("seed-"));
    const highestSeedId = seedExercises.reduce((highest, exercise) => Math.max(highest, Number(exercise.id.slice(5)) || 0), 0);
    let nextSeedId = highestSeedId + 1;
    sourceExercises.forEach((source) => {
      const exercise = seedExercises.find((item) => item.name === source.name);
      if (exercise) {
        const id = exercise.id;
        Object.assign(exercise, source, { id });
        updatedExercises = true;
        return;
      }
      const newExercise = { ...source, id: `seed-${nextSeedId++}` };
      state.data.exercises.push(newExercise);
      if (state.data.plans[source.day]) state.data.plans[source.day].push({ exerciseId: newExercise.id, sets: "3", reps: "12", resistance: "Media", guide: guideForExercise(newExercise) });
      updatedExercises = true;
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
