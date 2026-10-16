import test from 'node:test'
import assert from 'node:assert/strict'
import { isOwnerJid, parseCommand } from '../src/commands.js'
import { isValidHttpUrl } from '../src/api.js'

test('parses dot commands case-insensitively', () => {
  assert.deepEqual(parseCommand('  .VV  '), { name: 'vv', args: [], raw: '.VV' })
  assert.deepEqual(parseCommand('.tts hello world'), { name: 'tts', args: ['hello', 'world'], raw: '.tts hello world' })
})

test('ignores ordinary messages and unsupported prefixes', () => {
  assert.equal(parseCommand('hello'), null)
  assert.equal(parseCommand('!help'), null)
})

test('normalizes owner JIDs and rejects a different number or empty inputs', () => {
  assert.equal(isOwnerJid('923000000000@s.whatsapp.net', '923000000000'), true)
  assert.equal(isOwnerJid('923000000000:4@s.whatsapp.net', '923000000000'), true)
  assert.equal(isOwnerJid('923000000001@s.whatsapp.net', '923000000000'), false)
  assert.equal(isOwnerJid('status@broadcast', ''), false)
  assert.equal(isOwnerJid('status@broadcast', '923000000000'), false)
  assert.equal(isOwnerJid('', ''), false)
})

test('accepts only http and https URLs', () => {
  assert.equal(isValidHttpUrl('https://example.com/a?q=1'), true)
  assert.equal(isValidHttpUrl('http://localhost:3000'), true)
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false)
  assert.equal(isValidHttpUrl('not-a-url'), false)
})
