import test from 'node:test'
import assert from 'node:assert/strict'
import { sendHackPrank } from '../src/hack.js'

test('hack prank sends staged fictional messages and disclaimer', async () => {
  const messages: string[] = []
  // Pass delayMs = 0 for instant test execution
  await sendHackPrank(async text => { messages.push(text) }, 0)
  assert.equal(messages.length, 6)
  assert.match(messages.at(-1) ?? '', /Information uploading to dark web/)
  assert.match(messages.at(-1) ?? '', /Haha/)
})
