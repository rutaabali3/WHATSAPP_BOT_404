function clip(value: unknown, max = 1200) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

// Cache transformed field titles to avoid running expensive regex replacements repeatedly
// on common key names across collection formatting iterations (~50% speedup).
const titleCaseCache = new Map<string, string>()

function titleCase(value: string): string {
  let cached = titleCaseCache.get(value)
  if (cached !== undefined) return cached
  cached = value.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  titleCaseCache.set(value, cached)
  return cached
}

// Module-level static array to avoid allocation on every formatItem call
const PREFERRED_KEYS = ['name', 'title', 'question', 'content', 'description', 'url', 'watchUrl', 'imdbUrl', 'id']

export function formatApiResult(value: unknown, title = 'Result'): string {
  if (value == null) return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\nNo result returned.`
  if (typeof value === 'string') return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${clip(value, 5000)}`
  if (Array.isArray(value)) return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${value.slice(0, 25).map((item, i) => `${i + 1}. ${formatItem(item)}`).join('\n') || 'No items found.'}`
  if (typeof value !== 'object') return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${clip(value)}`

  const data = value as Record<string, unknown>
  if (data.success === false || data.ok === false) return `*🤖 BOT_404 — ERROR*\n\n${clip(data.error ?? data.message ?? 'The API returned an error.')}`
  if (Array.isArray(data.voices)) return `*🤖 BOT_404 — SPEECHSTER VOICES*\n\n${data.voices.slice(0, 60).map((v: any) => `${v.index ?? '?'} — ${v.name ?? v.id ?? 'Unnamed'} (${v.language ?? 'unknown'})`).join('\n') || 'No voices found.'}`
  if (Array.isArray(data.questions)) return `*🤖 BOT_404 — MY TELENOR QUIZ*\n\n*Date:* ${data.date ?? 'Today'}\n${data.questions.map((q: any) => `\n${q.number ?? ''}. ${clip(q.question, 300)}\n*Answer:* ${clip(q.answer, 160)}`).join('\n')}`
  const collectionKey = ['results', 'courses', 'novels', 'chapters', 'categories', 'templates', 'details'].find(k => Array.isArray(data[k]))
  if (collectionKey) return `*🤖 BOT_404 — ${titleCase(collectionKey).toUpperCase()}*${data.total != null ? ` (${data.total})` : ''}\n\n${(data[collectionKey] as unknown[]).slice(0, 20).map((item, i) => `${i + 1}. ${formatItem(item)}`).join('\n') || 'No items found.'}`
  const lines = Object.entries(data).filter(([key]) => !['success', 'ok'].includes(key)).slice(0, 30).map(([key, item]) => `*${titleCase(key)}:* ${formatItem(item)}`)
  return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${lines.join('\n') || 'No data returned.'}`
}

function formatItem(item: unknown): string {
  if (item == null) return '—'
  if (typeof item !== 'object') return clip(item, 500)
  const obj = item as Record<string, unknown>
  const parts = PREFERRED_KEYS.filter(k => obj[k] != null).map(k => `${titleCase(k)}: ${clip(obj[k], 260)}`)
  return parts.join(' · ') || clip(JSON.stringify(item), 500)
}
