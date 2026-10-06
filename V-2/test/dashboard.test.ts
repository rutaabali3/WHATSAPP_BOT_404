import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

test('dashboard denies access when token is missing or invalid', async () => {
  const mockRepo = {} as any
  const server = startDashboard(mockRepo)

  await new Promise<void>(resolve => server.once('listening', resolve))
  const address = server.address() as { port: number }

  try {
    const unauthRes = await fetch(`http://127.0.0.1:${address.port}/api/status`)
    assert.equal(unauthRes.status, 401)
    const unauthBody = await unauthRes.json()
    assert.deepEqual(unauthBody, { error: 'unauthorized' })

    const invalidRes = await fetch(`http://127.0.0.1:${address.port}/api/status`, {
      headers: { authorization: 'Bearer invalid-token' }
    })
    assert.equal(invalidRes.status, 401)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})
