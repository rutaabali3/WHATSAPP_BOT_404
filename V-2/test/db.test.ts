import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { writeMedia } from '../src/db.js'

test('writeMedia prevents path traversal outside designated directory', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'media-test-'))
  try {
    const maliciousId = '../../evil_file'
    const writtenPath = await writeMedia(tmpDir, maliciousId, 'jpg', Buffer.from('test data'))

    // The written path must be inside tmpDir
    const resolvedBase = path.resolve(tmpDir)
    const resolvedWritten = path.resolve(writtenPath)

    assert.ok(
      resolvedWritten.startsWith(resolvedBase + path.sep) || resolvedWritten === resolvedBase,
      `Expected ${resolvedWritten} to be within ${resolvedBase}`
    )

    // Ensure the file exists at resolvedWritten and contents match
    const content = await fs.readFile(resolvedWritten, 'utf8')
    assert.equal(content, 'test data')
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})
