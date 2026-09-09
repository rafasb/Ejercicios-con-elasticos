import { DEFAULT_EXERCISE_GUIDE, GUIDE_FIELDS, MUSCLE_TAGS } from "./constants.js";

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
  const items = markdown.split("\n").map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1]).filter(Boolean);
  return items.length ? `<ul>${items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>` : `<p>${formatInline(markdown)}</p>`;
}

export function technicalDetails(markdown) {
  const rows = markdown.split("\n").filter((line) => /^\|/.test(line) && !/^\|\s*:?-+/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim())).filter((cells) => cells.length === 2 && cells[0] !== "Parámetro");
  return rows.length ? `<dl class="technical-grid">${rows.map(([term, description]) => `<div><dt>${formatInline(term)}</dt><dd>${formatInline(description)}</dd></div>`).join("")}</dl>` : markdownList(markdown);
}

export function seconds(value) {
  return Math.max(0, Number.parseInt(value, 10) || 0);
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

export function repetitionsToCycles(value) {
  return Math.max(1, Number.parseInt(value, 10) || 1);
}

export function completedSets(entry) {
  return Math.max(0, Number.isFinite(entry?.completedSets) ? entry.completedSets : 0);
}

export function listForStorage(value) {
  return value.split("\n").map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean).map((line) => `- ${line}`).join("\n");
}

export function listForForm(value = "") {
  return value.split("\n").map((line) => line.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean).join("\n");
}

export function videosForStorage(value = "") {
  return value.split("\n").map((line) => line.trim()).filter((line) => /^https?:\/\//i.test(line));
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
  const fields = [["Músculos principales", exercise.primaryMuscles], ["Músculos secundarios", exercise.secondaryMuscles], ["Músculos estabilizadores", exercise.stabilizerMuscles], ["Resistencia o peso", exercise.resistance], ["Series y repeticiones", exercise.setsAndRepetitions], ["Tiempo tensión", `${guideForExercise(exercise).tension} s`], ["Tiempo pausa", `${guideForExercise(exercise).pause} s`], ["Tiempo distensión", `${guideForExercise(exercise).distension} s`], ["Tiempo descanso entre series", `${guideForExercise(exercise).rest} s`]].filter(([label, value]) => value && !(/^Tiempo/.test(label) && value === "0 s"));
  if (exercise.technicalNotes) fields.push(["Notas técnicas", exercise.technicalNotes]);
  const details = fields.length ? `<dl class="technical-grid">${fields.map(([term, description]) => `<div><dt>${escapeHtml(term)}</dt><dd>${formatInline(description)}</dd></div>`).join("")}</dl>` : "";
  return `<details class="details"><summary>Ver técnica y detalles</summary><section class="detail-section"><h4>Ejecución</h4>${markdownList(exercise.instructions)}</section>${details ? `<section class="detail-section"><h4>Detalles técnicos</h4>${details}</section>` : ""}${exercise.errors ? `<section class="detail-section"><h4>Errores a evitar</h4>${markdownList(exercise.errors)}</section>` : ""}</details>`;
}

export function parseRoutine(markdown) {
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

export function normaliseExercise(exercise) {
  const legacy = exerciseFromTechnical(exercise.technical || "");
  const detailFields = ["primaryMuscles", "secondaryMuscles", "stabilizerMuscles", "resistance", "setsAndRepetitions", "technicalNotes"];
  detailFields.forEach((field) => { exercise[field] = typeof exercise[field] === "string" ? exercise[field] : legacy[field]; });
  exercise.guide = exercise.guide ? { ...legacy.guide, ...guideForExercise(exercise) } : legacy.guide;
  exercise.tags = normaliseTags(exercise.tags ?? exercise.hashtags);
  return exercise;
}

export function historyToggle(historyDisplay = "list") {
  return `<div class="history-toggle" role="group" aria-label="Vista del historial"><button class="${historyDisplay === "list" ? "active" : ""}" data-action="set-history-display" data-history-display="list" aria-pressed="${historyDisplay === "list"}">Lista</button><button class="${historyDisplay === "calendar" ? "active" : ""}" data-action="set-history-display" data-history-display="calendar" aria-pressed="${historyDisplay === "calendar"}">Calendario</button></div>`;
}

export function renderHistorySession(session, index) {
  return `<article class="history-item"><div class="exercise-title"><div><h3>${session.day.replace("DÍA ", "Día ")}</h3><p class="history-meta">${escapeHtml(session.weekday || new Date(session.date).toLocaleDateString("es-ES", { weekday: "long" }))} · ${new Date(session.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p></div><button class="outline-button" data-action="reuse" data-history-index="${index}">Usar en plan</button></div>${session.entries.map((entry) => `<div class="result-line"><span>${escapeHtml(entry.name)}</span><span>${entry.sets ?? 0} series · ${escapeHtml(entry.reps)} reps · ${escapeHtml(entry.resistance)} <b class="badge" data-rating="${escapeHtml(entry.rating)}">${escapeHtml(entry.rating)}</b></span></div>`).join("")}</article>`;
}

export function renderHistoryCalendar(sessions, historyMonth, selectedHistoryDate) {
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

export function tagSummary(items, label, getExercise) {
  const counts = new Map();
  items.forEach((item) => getExercise(item.exerciseId)?.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  return counts.size ? `<section class="tag-summary" aria-label="${label}"><h3>${label}</h3><p>${[...counts].map(([tag, count]) => `<span>#${tag}: ${count}</span>`).join(" | ")}</p></section>` : "";
}
