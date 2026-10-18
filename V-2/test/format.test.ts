import test from 'node:test'
import assert from 'node:assert/strict'
import { formatApiResult, clip } from '../src/format.js'

test('formats SpeechSter voices with indexes and names', () => {
  const out = formatApiResult({ success: true, voices: [{ index: 1, name: 'Andrew', language: 'English' }] }, 'SpeechSter Voices')
  assert.match(out, /1 — Andrew \(English\)/)
  assert.doesNotMatch(out, /"index"/)
})

test('formats Telenor quiz as answers instead of JSON', () => {
  const out = formatApiResult({ success: true, date: 'Today', questions: [{ number: 1, question: 'Capital?', answer: 'Islamabad' }] }, 'Quiz')
  assert.match(out, /\*Answer:\* Islamabad/)
  assert.doesNotMatch(out, /"questions"/)
})

test('formats generic API errors cleanly', () => {
  assert.equal(formatApiResult({ success: false, error: 'Bad request' }, 'API'), '*🤖 BOT_404 — ERROR*\n\nBad request')
})

test('clip normalizes whitespace and truncates accurately', () => {
  assert.equal(clip('   hello    world   '), 'hello world')
  assert.equal(clip('hello world', 5), 'hell…')
  assert.equal(clip('', 10), '')
  assert.equal(clip(null, 10), '')
  assert.equal(clip('a'.repeat(20), 10), 'aaaaaaaaa…')
})

test('clip performs efficiently on large payloads', () => {
  const hugeText = 'hello world '.repeat(10000)
  const start = performance.now()
  const result = clip(hugeText, 100)
  const duration = performance.now() - start
  assert.equal(result.length, 100)
  assert.ok(duration < 10, `Clip should finish in under 10ms (took ${duration.toFixed(2)}ms)`)
})
