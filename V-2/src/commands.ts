export type CommandContext = {
  text: string
  isOwner: boolean
  hasQuoted: boolean
}

export type Command = { name: string; args: string[]; raw: string } | null

export function parseCommand(text: string, prefix = '.') : Command {
  const trimmed = text.trim()
  if (!trimmed.startsWith(prefix)) return null
  const parts = trimmed.slice(prefix.length).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return null
  return { name: parts[0].toLowerCase(), args: parts.slice(1), raw: trimmed }
}

export function helpText(prefix = '.') {
  return [
    '*🤖 BOT_404 MENU*',
    '',
    `*${prefix}help* - Show this menu`, `*Usage: ${prefix}help*`, '',
    `*${prefix}vv* - Recover a quoted view-once media`, `*Usage: reply to view-once msg with ${prefix}vv*`, '',
    `*${prefix}hack* - Run a fictional hacker prank`, `*Usage: reply to a message with ${prefix}hack*`, '',
    `*${prefix}antidelete* - Toggle anti-delete (owner only)`, `*Usage: ${prefix}antidelete on/off*`, '',
    `*${prefix}tts* - Convert text to voice`, `*Usage: ${prefix}tts <text> [voiceIndex]*`, '',
    `*${prefix}dl* - Fetch media from a link`, `*Usage: ${prefix}dl <url>*`, '',
    `*${prefix}screenshot* - Capture a webpage`, `*Usage: ${prefix}screenshot <url>*`, '',
    `*${prefix}voices* - List available TTS voices`, `*Usage: ${prefix}voices*`, '',
    `*${prefix}snapinfo* - Inspect a webpage's info`, `*Usage: ${prefix}snapinfo <url>*`, '',
    `*${prefix}image* - Generate an AI image`, `*Usage: ${prefix}image <prompt>*`, '',
    `*${prefix}video* - Generate an AI video`, `*Usage: ${prefix}video <prompt>*`, '',
    `*${prefix}imgchat* - Chat about an image`, `*Usage: ${prefix}imgchat <image-url> <prompt>*`, '',
    `*${prefix}mail* - Manage temp mail`, `*Usage: ${prefix}mail create/inbox/read/delete*`, '',
    `*${prefix}med* - Search medicine info`, `*Usage: ${prefix}med <name>*`, '',
    `*${prefix}medinfo* - Get medicine details by ID`, `*Usage: ${prefix}medinfo <id>*`, '',
    `*${prefix}manga* - Search/read manga`, `*Usage: ${prefix}manga search/chapters/pages <value>*`, '',
    `*${prefix}novel* - Search/read novels`, `*Usage: ${prefix}novel search/chapters/read <value>*`, '',
    `*${prefix}unovel* - Search unofficial novels`, `*Usage: ${prefix}unovel search/detail/novels <value>*`, '',
    `*${prefix}wiki* - Get a Wikipedia article`, `*Usage: ${prefix}wiki <article>*`, '',
    `*${prefix}movie* - Get movie info`, `*Usage: ${prefix}movie <title>*`, '',
    `*${prefix}zip* - Zip a url's content`, `*Usage: ${prefix}zip <url>*`, '',
    `*${prefix}hand* - Handwriting-style text image`, `*Usage: ${prefix}hand <text>*`, '',
    `*${prefix}quiz* - Start a quiz`, `*Usage: ${prefix}quiz*`, '',
    `*${prefix}n8n* - n8n workflow templates`, `*Usage: ${prefix}n8n categories/templates*`, '',
    `*${prefix}courses* - Search free courses`, `*Usage: ${prefix}courses <query>*`
  ].join('\n')
}

export function isOwnerJid(jid: string, ownerNumber: string) {
  if (!jid || !ownerNumber) return false
  const normalizedJid = jid.split(':')[0].split('@')[0].replace(/\D/g, '')
  const normalizedOwner = ownerNumber.replace(/\D/g, '')
  if (!normalizedJid || !normalizedOwner) return false
  return normalizedJid === normalizedOwner
}
