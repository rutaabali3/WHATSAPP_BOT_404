import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { writeMedia, ensureMediaDir } from '../src/db.js'

test('writeMedia writes file inside base directory safely', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bot404-test-'))
  try {
    await ensureMediaDir(tmpDir)
    const filePath = await writeMedia(tmpDir, 'msg_12345', 'png', Buffer.from('test data'))
    assert.equal(filePath.startsWith(tmpDir), true)
    const content = await fs.readFile(filePath)
    assert.equal(content.toString(), 'test data')
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})

test('writeMedia normalizes unsafe messageId characters', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bot404-test-'))
  try {
    await ensureMediaDir(tmpDir)
    const filePath = await writeMedia(tmpDir, '../../../etc/passwd', 'jpg', Buffer.from('test'))
    const normalizedDir = path.resolve(tmpDir)
    assert.equal(filePath.startsWith(normalizedDir), true)
    assert.equal(path.basename(filePath), '_________etc_passwd.jpg')
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})
