import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { writeMedia, ensureMediaDir } from '../src/db.js'

test('writeMedia creates files within the intended directory', async () => {
  const tmpDir = path.resolve('./data/test-media')
  await ensureMediaDir(tmpDir)

  try {
    const writtenPath = await writeMedia(tmpDir, 'msg_12345', 'jpg', Buffer.from('test-data'))
    assert.ok(writtenPath.startsWith(tmpDir))
    const content = await fs.readFile(writtenPath, 'utf8')
    assert.equal(content, 'test-data')
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})

test('writeMedia sanitizes messageId and prevents path traversal', async () => {
  const tmpDir = path.resolve('./data/test-media')
  await ensureMediaDir(tmpDir)

  try {
    const writtenPath = await writeMedia(tmpDir, '../../../etc/passwd', 'png', Buffer.from('fake'))
    assert.ok(writtenPath.startsWith(tmpDir))
    assert.ok(!writtenPath.includes('etc/passwd'))
    assert.ok(writtenPath.endsWith('________etc_passwd.png'))
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})
