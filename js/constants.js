export const STORAGE_KEY = "ritmo-data-v1";
export const ROUTINE_URL = "rutina_entrenamiento_bandas.md";
export const ROUTINE_JSON_URL = "rutina.json";
export const MIN_DAYS = 3;
export const MAX_DAYS = 7;
// Maximum number of finished sessions kept in history (most recent first).
export const MAX_HISTORY = 30;
export const DEFAULT_DAYS = ["DÍA 1", "DÍA 2", "DÍA 3"];
export const MUSCLE_TAGS = ["Abdominal", "Biceps", "Cuadriceps", "Espalda", "Gluteo", "Hombro", "Lumbar", "Pectoral", "Triceps"];
// Display labels in Spanish; keys must stay in MUSCLE_TAGS.
export const MUSCLE_TAG_LABELS = { Abdominal: "Abdominal", Biceps: "Bíceps", Cuadriceps: "Cuádriceps", Espalda: "Espalda", Gluteo: "Glúteo", Hombro: "Hombro", Lumbar: "Lumbar", Pectoral: "Pectoral", Triceps: "Tríceps" };
export const DEFAULT_GUIDE_SETTINGS = { preparation: 10, tension: 3, distension: 2, rest: 120, volume: 0.6 };
// Cap for synchronous guide cycles derived from free-form repetitions (backup/user data).
export const MAX_GUIDE_CYCLES = 999;
// Upper bound for guide phase durations restored from backup (avoids huge/hung timers).
export const MAX_GUIDE_SECONDS = 3600;
// Audio cue per guide phase; keys must match the guide phases (see `runTensionCycle()`/`startGuide()` in `js/app.js`).
export const GUIDE_CUE_FILES = { Tension: "assets/Tension.m4a", Pausa: "assets/Pausa.m4a", Distension: "assets/Distension.m4a", Descanso: "assets/Descanso.m4a", Preparacion: "assets/Preparacion.m4a" };
// Oscillator fallback (Hz) used only when the m4a buffer cannot be loaded or decoded.
export const GUIDE_CUE_FALLBACK_HZ = { Tension: 660, Pausa: 523, Distension: 392, Descanso: 294, Preparacion: 523 };
// "Preparación" cue played at the start of the guide; has its own m4a and a 523 Hz fallback.
export const GUIDE_CUE_PREPARATION = "Preparacion";
export const DEFAULT_EXERCISE_GUIDE = { tension: 0, pause: 0, distension: 0, rest: 120 };
export const EXERCISE_DETAIL_FIELDS = ["primaryMuscles", "secondaryMuscles", "stabilizerMuscles", "resistance", "setsAndRepetitions", "technicalNotes"];
export const GUIDE_FIELDS = ["tension", "pause", "distension", "rest"];
export const VIEW_COPY = { train: "Tu ciclo semanal, listo para moverse.", plan: "Define objetivos claros para cada sesión.", history: "Mira lo que hiciste y ajusta el rumbo.", exercises: "Técnica antes que velocidad." };
export const RATING_OPTIONS = ["fácil", "aceptable", "imposible"];
