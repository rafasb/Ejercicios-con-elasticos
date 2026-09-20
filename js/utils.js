import { DEFAULT_EXERCISE_GUIDE, GUIDE_FIELDS, MAX_GUIDE_CYCLES, MAX_GUIDE_SECONDS, MUSCLE_TAGS } from "./constants.js";

export function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

export function formatInline(value = "") {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function markdownList(markdown) {
  const text = String(markdown ?? "");
  const items = text.split("\n").map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1]).filter(Boolean);
  return items.length ? `<ul>${items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>` : `<p>${formatInline(text)}</p>`;
}

export function technicalDetails(markdown) {
  const rows = markdown.split("\n").filter((line) => /^\|/.test(line) && !/^\|\s*:?-+/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim())).filter((cells) => cells.length === 2 && cells[0] !== "Parámetro");
  return rows.length ? `<dl class="technical-grid">${rows.map(([term, description]) => `<div><dt>${formatInline(term)}</dt><dd>${formatInline(description)}</dd></div>`).join("")}</dl>` : markdownList(markdown);
}

export function seconds(value) {
  return Math.min(MAX_GUIDE_SECONDS, Math.max(0, Number.parseInt(value, 10) || 0));
}

export function guideForExercise(exercise) {
  return Object.fromEntries(GUIDE_FIELDS.map((field) => [field, exercise?.guide?.[field] === undefined ? DEFAULT_EXERCISE_GUIDE[field] : seconds(exercise.guide[field])]));
}

export function parseTechnicalRows(markdown = "") {
  return markdown.split("\n").filter((line) => /^\|/.test(line) && !/^\|\s*:?-+/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/\*\*/g, ""))).filter((cells) => cells.length === 2 && cells[0] !== "Parámetro");
}

export function parseCadence(value = "") {
  const matches = [...value.matchAll(/(\d+)\s*segundos?/gi)].map((match) => Number(match[1]));
  if (!matches.length) return { ...DEFAULT_EXERCISE_GUIDE };
  const normalized = value.toLowerCase();
  const pause = /pausa|abajo|arriba|contracci[oó]n|apret[oó]n|rozando/.test(normalized) ? matches[1] || 0 : 0;
  return { tension: matches[0] || 0, pause, distension: matches[pause ? 2 : 1] || 0, rest: DEFAULT_EXERCISE_GUIDE.rest };
}

export function exerciseFromTechnical(markdown) {
  const exercise = { primaryMuscles: "", secondaryMuscles: "", stabilizerMuscles: "", resistance: "", setsAndRepetitions: "", technicalNotes: "", guide: { ...DEFAULT_EXERCISE_GUIDE } };
  const notes = [];
  for (const [term, description] of parseTechnicalRows(markdown)) {
    const key = term.toLowerCase();
    if (key === "músculos principales") exercise.primaryMuscles = description;
    else if (key === "músculos secundarios") exercise.secondaryMuscles = description;
    else if (key === "músculos estabilizadores") exercise.stabilizerMuscles = description;
    else if (/^resistencia/.test(key)) exercise.resistance = description;
    else if (key === "series y repeticiones") exercise.setsAndRepetitions = description;
    else if (key === "tiempo/cadencia") exercise.guide = parseCadence(description);
    else notes.push(`${term}: ${description}`);
  }
  exercise.technicalNotes = notes.join("\n");
  return exercise;
}

export function repetitionsToCycles(value) {
  return Math.min(MAX_GUIDE_CYCLES, Math.max(1, Number.parseInt(value, 10) || 1));
}

export function completedSets(entry) {
  return Math.max(0, Number.isFinite(entry?.completedSets) ? entry.completedSets : 0);
}

export function listForStorage(value) {
  const text = String(value ?? "");
  return text.split("\n").map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean).map((line) => `- ${line}`).join("\n");
}

export function listForForm(value = "") {
  const text = String(value ?? "");
  return text.split("\n").map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean).join("\n");
}

export function videosForStorage(value = "") {
  const text = String(value ?? "");
  return text.split("\n").map((line) => line.trim()).filter((line) => /^https?:\/\//i.test(line));
}

export function normaliseTag(value) {
  const clean = String(value || "").replace(/^\s*#\s*/, "").trim().toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return MUSCLE_TAGS.find((tag) => tag.toLocaleLowerCase("es-ES") === clean);
}

export function normaliseTags(value = []) {
  const entries = Array.isArray(value) ? value : String(value).split(/[\n,]/);
  return [...new Set(entries.flatMap((entry) => String(entry).match(/#\s*[\p{L}]+|[^#,\n]+/gu) || []).map(normaliseTag).filter(Boolean))];
}

export function tagsForForm() {
  return MUSCLE_TAGS.map((tag) => `<option value="${tag}">${tag}</option>`).join("");
}

export function tagBadges(exercise) {
  return exercise.tags?.length ? `<div class="tag-list" aria-label="Etiquetas musculares">${exercise.tags.map((tag) => `<span class="tag-badge">#${escapeHtml(tag)}</span>`).join("")}</div>` : "";
}

export function tagFilter(selectedTags = []) {
  return `<div class="tag-filter"><label for="tag-filter">Filtrar por grupos musculares</label><select id="tag-filter" data-tag-filter multiple size="4">${MUSCLE_TAGS.map((tag) => `<option value="${tag}" ${selectedTags.includes(tag) ? "selected" : ""}>#${tag}</option>`).join("")}</select><button class="text-button" data-action="clear-tag-filter" ${selectedTags.length ? "" : "disabled"}>Limpiar filtros</button></div>`;
}

export function matchesSelectedTags(exercise, selectedTags = []) {
  return selectedTags.every((tag) => exercise.tags?.includes(tag));
}

export function historyDateKey(session) {
  const date = new Date(session.date);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function historyDayLabel(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export function exerciseDetails(exercise) {
  const fields = [["Músculos principales", exercise.primaryMuscles], ["Músculos secundarios", exercise.secondaryMuscles], ["Músculos estabilizadores", exercise.stabilizerMuscles], ["Resistencia o peso", exercise.resistance], ["Series y repeticiones", exercise.setsAndRepetitions], ["Tiempo tensión", `${guideForExercise(exercise).tension} s`], ["Tiempo pausa", `${guideForExercise(exercise).pause} s`], ["Tiempo distensión", `${guideForExercise(exercise).distension} s`]].filter(([label, value]) => value && !(/^Tiempo/.test(label) && value === "0 s"));
  if (exercise.technicalNotes) fields.push(["Notas técnicas", exercise.technicalNotes]);
  const details = fields.length ? `<dl class="technical-grid">${fields.map(([term, description]) => `<div><dt>${escapeHtml(term)}</dt><dd>${formatInline(description)}</dd></div>`).join("")}</dl>` : "";
  return `<details class="details"><summary>Ver técnica y detalles</summary><section class="detail-section"><h4>Ejecución</h4>${markdownList(exercise.instructions)}</section>${details ? `<section class="detail-section"><h4>Detalles técnicos</h4>${details}</section>` : ""}${exercise.errors ? `<section class="detail-section"><h4>Errores a evitar</h4>${markdownList(exercise.errors)}</section>` : ""}</details>`;
}

export function parseRoutine(markdown) {
  if (!String(markdown || "").trim()) throw new Error("La rutina está vacía: añade días con ## DÍA N y ejercicios con ### N. Nombre.");
  if (!/^##\s+DÍA \d+/m.test(String(markdown))) throw new Error("No se encontró ningún día: añade al menos un encabezado ## DÍA N (p. ej. ## DÍA 1).");
  const exercises = [];
  let day = "";
  const sections = String(markdown).split(/(?=^## |^### )/m);
  for (const section of sections) {
    const dayMatch = section.match(/^##\s+(DÍA \d+)/m);
    if (dayMatch) { day = dayMatch[1]; continue; }
    if (!/^###\s+/m.test(section)) continue;
    const heading = section.match(/^###\s+\d+\.\s+(.+?)\s*(?:\(([^)]+)\))?\s*$/m);
    if (!heading) throw new Error("Ejercicio con encabezado inválido: usa ### N. Nombre (Músculo) (p. ej. ### 1. Sentadilla (Cuadriceps)).");
    const name = heading[1].trim();
    if (!name) throw new Error("Ejercicio sin nombre: usa ### N. Nombre (Músculo) (p. ej. ### 1. Sentadilla (Cuadriceps)).");
    if (!day) throw new Error(`El ejercicio "${name}" no está bajo ningún día: añade ## DÍA N encima.`);
    if (!/#### Hashtags/m.test(section)) throw new Error(`Al ejercicio "${name}" le falta #### Hashtags: añade una línea como - #Cuadriceps.`);
    const hashtagSection = (section.match(/#### Hashtags\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1];
    const unknown = (hashtagSection.match(/#\s*[\p{L}]+/gu) || []).filter((tag) => !normaliseTag(tag));
    if (unknown.length) throw new Error(`Etiquetas no válidas en "${name}": ${unknown.join(", ")}. Usa solo: ${MUSCLE_TAGS.join(", ")}.`);
    const tags = normaliseTags(hashtagSection);
    if (!tags.length) throw new Error(`El ejercicio "${name}" no tiene etiquetas válidas: añade al menos una de ${MUSCLE_TAGS.join(", ")}.`);
    const summary = (section.match(/^\*([^*]+)\*/m) || ["", ""])[1].trim();
    const execution = (section.match(/#### Ejecución paso a paso\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1].trim();
    const technical = (section.match(/#### Detalles técnicos\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1].trim();
    const errors = (section.match(/#### Errores comunes a evitar\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1].trim();
    const videos = [...((section.match(/#### Vídeos\n([\s\S]*?)(?=\n####|$)/) || ["", ""])[1].matchAll(/https?:\/\/[^\s)>]+/g))].map(([url]) => url);
    exercises.push({ id: `seed-${exercises.length + 1}`, name, muscle: heading[2] || "General", summary, instructions: execution, tags, errors, videos, day, ...exerciseFromTechnical(technical) });
  }
  if (!exercises.length) throw new Error("No se encontró ningún ejercicio: añade líneas ### N. Nombre (Músculo) bajo cada ## DÍA N.");
  return exercises;
}

export function validateRoutineData(data) {
  if (!Array.isArray(data)) throw new Error("La rutina no es válida: se esperaba una lista de ejercicios.");
  if (data.length !== 18) throw new Error(`La rutina debe tener 18 ejercicios (DÍA 1-3): hay ${data.length}. Revisa ## DÍA 1, ## DÍA 2 y ## DÍA 3.`);
  const allowed = ["DÍA 1", "DÍA 2", "DÍA 3"];
  const seen = new Set();
  for (const [index, exercise] of data.entries()) {
    const where = `Ejercicio ${index + 1}`;
    if (!exercise || typeof exercise !== "object") throw new Error(`${where} no es válido: revisa ### N. Nombre (Músculo).`);
    if (!String(exercise.name || "").trim()) throw new Error(`${where} no tiene nombre: usa ### N. Nombre (Músculo).`);
    if (!allowed.includes(exercise.day)) throw new Error(`El ejercicio "${exercise.name || where}" tiene día no válido: usa DÍA 1, DÍA 2 o DÍA 3.`);
    seen.add(exercise.day);
    if (!Array.isArray(exercise.tags) || !exercise.tags.length) throw new Error(`El ejercicio "${exercise.name}" no tiene etiquetas válidas: añade al menos una de ${MUSCLE_TAGS.join(", ")}.`);
    const bad = exercise.tags.filter((tag) => !MUSCLE_TAGS.includes(tag));
    if (bad.length) throw new Error(`Etiquetas no válidas en "${exercise.name}": ${bad.join(", ")}. Usa solo: ${MUSCLE_TAGS.join(", ")}.`);
  }
  const missing = allowed.filter((day) => !seen.has(day));
  if (missing.length) throw new Error(`Faltan días en la rutina: ${missing.join(", ")}. Añade ## ${missing.join(", ## ")}.`);
  return data;
}

export function normaliseExercise(exercise) {
  const legacy = exerciseFromTechnical(typeof exercise.technical === "string" ? exercise.technical : "");
  const detailFields = ["primaryMuscles", "secondaryMuscles", "stabilizerMuscles", "resistance", "setsAndRepetitions", "technicalNotes"];
  for (const field of detailFields) { exercise[field] = typeof exercise[field] === "string" ? exercise[field] : legacy[field]; }
  exercise.guide = exercise.guide ? { ...legacy.guide, ...guideForExercise(exercise) } : legacy.guide;
  exercise.tags = normaliseTags(exercise.tags ?? exercise.hashtags);
  exercise.videos = videosForStorage(Array.isArray(exercise.videos) ? exercise.videos.join("\n") : exercise.videos);
  exercise.id = String(exercise.id ?? "");
  return exercise;
}

export function normaliseHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((session) => session && typeof session === "object" && !Array.isArray(session))
    .map((session) => ({
      date: String(session.date ?? ""),
      weekday: String(session.weekday ?? ""),
      day: /^DÍA [1-7]$/.test(String(session.day ?? "")) ? String(session.day) : "",
      entries: (Array.isArray(session.entries) ? session.entries : [])
        .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
        .map((entry) => {
          const guide = entry.guide && typeof entry.guide === "object" && !Array.isArray(entry.guide) ? entry.guide : {};
          return {
            name: String(entry.name ?? ""),
            exerciseId: String(entry.exerciseId ?? ""),
            sets: Number(entry.sets) || 0,
            reps: String(entry.reps ?? ""),
            resistance: String(entry.resistance ?? ""),
            rating: String(entry.rating ?? ""),
            guide: Object.fromEntries(GUIDE_FIELDS.map((field) => [field, guide[field] === undefined ? DEFAULT_EXERCISE_GUIDE[field] : seconds(guide[field])]))
          };
        })
    }));
}

export function historyToggle(historyDisplay = "list") {
  return `<div class="history-toggle" role="group" aria-label="Vista del historial"><button class="${historyDisplay === "list" ? "active" : ""}" data-action="set-history-display" data-history-display="list" aria-pressed="${historyDisplay === "list"}">Lista</button><button class="${historyDisplay === "calendar" ? "active" : ""}" data-action="set-history-display" data-history-display="calendar" aria-pressed="${historyDisplay === "calendar"}">Calendario</button></div>`;
}

export function renderHistorySession(session, index) {
  return `<article class="history-item"><div class="exercise-title"><div><h3>${escapeHtml(String(session.day ?? "").replace("DÍA ", "Día "))}</h3><p class="history-meta">${escapeHtml(session.weekday || new Date(session.date).toLocaleDateString("es-ES", { weekday: "long" }))} · ${new Date(session.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p></div><button class="outline-button" data-action="reuse" data-history-index="${index}">Usar en plan</button></div>${session.entries.map((entry) => `<div class="result-line"><span>${escapeHtml(entry.name)}</span><span>${escapeHtml(entry.sets ?? 0)} series · ${escapeHtml(entry.reps)} reps · ${escapeHtml(entry.resistance)} <b class="badge" data-rating="${escapeHtml(entry.rating)}">${escapeHtml(entry.rating)}</b></span></div>`).join("")}</article>`;
}

export function renderHistoryCalendar(sessions, historyMonth, selectedHistoryDate) {
  const year = historyMonth.getFullYear();
  const month = historyMonth.getMonth();
  const sessionsByDate = new Map();
  for (const [index, session] of sessions.entries()) {
    const key = historyDateKey(session);
    if (key) sessionsByDate.set(key, [...(sessionsByDate.get(key) || []), { session, index }]);
  }
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

export function tagSummary(items, label, getExercise) {
  const counts = new Map();
  for (const item of items) {
    for (const tag of (getExercise(item?.exerciseId)?.tags ?? [])) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return counts.size ? `<section class="tag-summary" aria-label="${label}"><h3>${label}</h3><p>${[...counts].map(([tag, count]) => `<span>#${tag}: ${count}</span>`).join(" | ")}</p></section>` : "";
}
