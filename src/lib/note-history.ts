// Local version history + offline cache for notes.
// Snapshots are stored per note in localStorage (last 20 versions),
// so students can restore earlier drafts and read notes offline.

export interface NoteVersion {
  at: string;        // ISO timestamp
  title: string;
  html: string;
}

const VER_KEY = (id: string) => `insightly:note-versions:${id}`;
const CACHE_KEY = (id: string) => `insightly:note-cache:${id}`;
const MAX_VERSIONS = 20;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function getVersions(noteId: string): NoteVersion[] {
  if (typeof window === "undefined") return [];
  return safeParse<NoteVersion[]>(localStorage.getItem(VER_KEY(noteId)), []);
}

/** Save a snapshot if content actually changed since the last one. */
export function pushVersion(noteId: string, title: string, html: string) {
  if (typeof window === "undefined") return;
  const list = getVersions(noteId);
  if (list[0]?.html === html && list[0]?.title === title) return;
  const next = [{ at: new Date().toISOString(), title, html }, ...list].slice(0, MAX_VERSIONS);
  try { localStorage.setItem(VER_KEY(noteId), JSON.stringify(next)); } catch { /* quota */ }
}

export function clearVersions(noteId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VER_KEY(noteId));
}

/** Offline cache — last known good copy of a note. */
export function cacheNote(noteId: string, title: string, html: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY(noteId), JSON.stringify({ title, html, at: new Date().toISOString() }));
  } catch { /* quota */ }
}

export function readCachedNote(noteId: string): { title: string; html: string; at: string } | null {
  if (typeof window === "undefined") return null;
  return safeParse<{ title: string; html: string; at: string } | null>(localStorage.getItem(CACHE_KEY(noteId)), null);
}

/** Build a standalone HTML document for export/print. */
export function buildExportHtml(title: string, html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.6; color: #111; }
  h1,h2,h3 { font-family: ui-sans-serif, system-ui, sans-serif; }
  img { max-width: 100%; border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #999; padding: 6px; }
  blockquote { border-left: 3px solid #999; margin: 0; padding-left: 12px; color: #444; }
  pre { background: #f4f4f5; padding: 12px; border-radius: 8px; overflow-x: auto; }
</style></head>
<body><h1>${escapeHtml(title)}</h1>${html}</body></html>`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}
