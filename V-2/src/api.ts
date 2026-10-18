import axios, { AxiosRequestConfig } from 'axios'

const base = () => process.env.API_BASE_URL ?? 'http://127.0.0.1:3000'
const timeout = () => Number(process.env.API_TIMEOUT_MS ?? 45_000)

async function request<T = unknown>(path: string, config: AxiosRequestConfig = {}) {
  const response = await axios.request<T>({ url: `${base()}${path}`, timeout: timeout(), validateStatus: s => s < 500, ...config })
  if (response.status >= 400) throw new Error(`API ${path} returned HTTP ${response.status}`)
  return response
}

export async function getJson(path: string, params: Record<string, string | number | undefined> = {}) {
  return (await request(path, { method: 'GET', params })).data
}

export async function getBinary(path: string, params: Record<string, string | number | undefined> = {}) {
  const response = await request<ArrayBuffer>(path, { method: 'GET', params, responseType: 'arraybuffer' })
  return { data: Buffer.from(response.data), contentType: String(response.headers['content-type'] ?? 'application/octet-stream') }
}

export async function postJson<T = unknown>(path: string, data: unknown) { return (await request<T>(path, { method: 'POST', data })).data }
export async function postBinary(path: string, data: unknown) {
  const response = await request<ArrayBuffer>(path, { method: 'POST', data, responseType: 'arraybuffer' })
  return { data: Buffer.from(response.data), contentType: String(response.headers['content-type'] ?? 'application/octet-stream') }
}

export const tts = (text: string, voiceIndex = 1, pitch = 0, rate = 0) => postBinary(process.env.API_TTS_PATH ?? '/api/tts', { voiceIndex, text: text.slice(0, 1950), pitch, rate })
export const voices = () => getJson('/api/voices')
export const downloader = (url: string) => getJson(process.env.API_DOWNLOAD_PATH ?? '/api/alldl', { url })
export const screenshot = (url: string) => getBinary(process.env.API_SCREENSHOT_PATH ?? '/api/websnap', { action: 'screenshot', url })
export const websnapInfo = (url: string) => getJson('/api/websnap', { action: 'info', url })
export type ImageGenerateResult = { success?: boolean; imageUrl?: string; prompt?: string; ratio?: string; error?: string }
export type VideoGenerateResult = { success?: boolean; videoUrl?: string; prompt?: string; ratio?: string; error?: string }
export const imageGenerate = (prompt: string, ratio = '1:1') => postJson<ImageGenerateResult>('/api/tti', { prompt: prompt.slice(0, 1000), ratio })
export const videoGenerate = (prompt: string, imageBase64: string, ratio = 'auto', duration = 10) => postJson<VideoGenerateResult>('/api/ptv', { prompt: prompt.slice(0, 1000), imageBase64, ratio, duration })
export const imageChat = (imageUrl: string, userPrompt: string) => postJson('/api/imgchat', { url: imageUrl, userPrompt: userPrompt.slice(0, 1000) })
export const tempMail = (action: string, value?: string) => getJson('/api/mail', { action, name: value, mail: value })
export const medicineSearch = (q: string) => getJson('/api/search', { q: q.slice(0, 300) })
export const medicineDetails = (id: string) => getJson('/api/details', { id })
export const transcribe = (audio: unknown) => postJson('/api/transcribe', audio)
export const manga = (action: string, q?: string, id?: string) => getJson('/api/manga', { action, q: q ? q.slice(0, 300) : undefined, id })
export const novel = (action: string, q?: string, novelId?: string, fileUrl?: string) => getJson('/api/novel', { action, q: q ? q.slice(0, 300) : undefined, novelId, fileUrl })
export const urduNovel = (action: string, q?: string, url?: string) => getJson('/api/unovel', { action, q: q ? q.slice(0, 300) : undefined, url })
export const movieSearch = (q: string) => getJson('/api/msearch', { q: q.slice(0, 300) })
export const wikipediaPdf = (query: string) => getBinary('/api/wikipdf', { query: query.slice(0, 300) })
export const websiteZip = (url: string) => postBinary('/api/zip', { url })
export const certificate = (data: unknown) => postBinary('/api/certificate', data)
export const certificateTemplates = () => getJson('/api/certificate', { action: 'templates' })
export const handwriting = (text: string, font?: string, color?: string) => getBinary('/api/hand', { text: text.slice(0, 2000), font, color })
export const telenorQuiz = () => getJson('/api/telenor', { format: 'answers' })
export const n8n = (endpoint: string, params: Record<string, string | number> = {}) => getJson('/api/n8n', { endpoint, ...params })
export const courses = (q: string) => getJson('/api/courses', { q })
export const driveup = (params: Record<string, string | number>) => getJson('/api/driveup', params)

// Prevent Server-Side Request Forgery (SSRF) by validating protocol and blocking internal/private targets
export function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '')
    if (
      host === 'localhost' ||
      host === '0' ||
      host === '::' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^0\./.test(host) ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host)
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}