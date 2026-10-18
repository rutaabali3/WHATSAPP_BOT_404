const MULTI_SPACE_REGEX = /\s+/g
const DELIMITER_REGEX = /[-_]/g
const WORD_BOUND_REGEX = /\b\w/g

const titleCaseCache = new Map<string, string>()

function clip(value: unknown, max = 1200): string {
  if (value == null || value === '') return ''
  const raw = typeof value === 'string' ? value : String(value)
  if (raw.length === 0) return ''
  // Replace consecutive whitespace and trim
  const text = raw.replace(MULTI_SPACE_REGEX, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

// Caches title-cased property names to avoid redundant regex operations
function titleCase(value: string): string {
  let cached = titleCaseCache.get(value)
  if (cached !== undefined) return cached
  cached = value.replace(DELIMITER_REGEX, ' ').replace(WORD_BOUND_REGEX, c => c.toUpperCase())
  if (titleCaseCache.size < 500) {
    titleCaseCache.set(value, cached)
  }
  return cached
}

const PREFERRED_ITEM_KEYS = ['name', 'title', 'question', 'content', 'description', 'url', 'watchUrl', 'imdbUrl', 'id'] as const
const COLLECTION_KEYS = ['results', 'courses', 'novels', 'chapters', 'categories', 'templates', 'details'] as const

export function formatApiResult(value: unknown, title = 'Result'): string {
  if (value == null) return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\nNo result returned.`
  if (typeof value === 'string') return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${clip(value, 5000)}`
  if (Array.isArray(value)) return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${value.slice(0, 25).map((item, i) => `${i + 1}. ${formatItem(item)}`).join('\n') || 'No items found.'}`
  if (typeof value !== 'object') return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${clip(value)}`

  const data = value as Record<string, unknown>
  if (data.success === false || data.ok === false) return `*🤖 BOT_404 — ERROR*\n\n${clip(data.error ?? data.message ?? 'The API returned an error.')}`
  if (Array.isArray(data.voices)) return `*🤖 BOT_404 — SPEECHSTER VOICES*\n\n${data.voices.slice(0, 60).map((v: any) => `${v.index ?? '?'} — ${v.name ?? v.id ?? 'Unnamed'} (${v.language ?? 'unknown'})`).join('\n') || 'No voices found.'}`
  if (Array.isArray(data.questions)) return `*🤖 BOT_404 — MY TELENOR QUIZ*\n\n*Date:* ${data.date ?? 'Today'}\n${data.questions.map((q: any) => `\n${q.number ?? ''}. ${clip(q.question, 300)}\n*Answer:* ${clip(q.answer, 160)}`).join('\n')}`

  const collectionKey = COLLECTION_KEYS.find(k => Array.isArray(data[k]))
  if (collectionKey) return `*🤖 BOT_404 — ${titleCase(collectionKey).toUpperCase()}*${data.total != null ? ` (${data.total})` : ''}\n\n${(data[collectionKey] as unknown[]).slice(0, 20).map((item, i) => `${i + 1}. ${formatItem(item)}`).join('\n') || 'No items found.'}`

  const lines = Object.entries(data).filter(([key]) => key !== 'success' && key !== 'ok').slice(0, 30).map(([key, item]) => `*${titleCase(key)}:* ${formatItem(item)}`)
  return `*🤖 BOT_404 — ${title.toUpperCase()}*\n\n${lines.join('\n') || 'No data returned.'}`
}

function formatItem(item: unknown): string {
  if (item == null) return '—'
  if (typeof item !== 'object') return clip(item, 500)
  const obj = item as Record<string, unknown>

  const parts: string[] = []
  for (let i = 0; i < PREFERRED_ITEM_KEYS.length; i++) {
    const k = PREFERRED_ITEM_KEYS[i]
    if (obj[k] != null) {
      parts.push(`${titleCase(k)}: ${clip(obj[k], 260)}`)
    }
  }
  return parts.join(' · ') || clip(JSON.stringify(item), 500)
}
