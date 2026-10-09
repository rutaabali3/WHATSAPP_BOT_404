import test from 'node:test'
import assert from 'node:assert/strict'
import { startDashboard } from '../src/dashboard.js'

test('dashboard authorization checks using constant-time comparison', async () => {
  process.env.DASHBOARD_TOKEN = 'secret-token-123'
  process.env.DASHBOARD_PORT = '0'
  const mockRepo = {} as any
  const server = startDashboard(mockRepo)

  await new Promise<void>((resolve) => {
    if (server.listening) resolve()
    else server.once('listening', () => resolve())
  })

  const address = server.address() as { port: number }
  const url = `http://127.0.0.1:${address.port}/api/status`

  try {
    // Request without authorization header
    const resUnauthorized = await fetch(url)
    assert.equal(resUnauthorized.status, 401)
    const jsonUnauthorized = (await resUnauthorized.json()) as { error: string }
    assert.deepEqual(jsonUnauthorized, { error: 'unauthorized' })

    // Request with invalid token
    const resWrongToken = await fetch(url, {
      headers: { authorization: 'Bearer wrong-token' }
    })
    assert.equal(resWrongToken.status, 401)

    // Request with valid token
    const resAuthorized = await fetch(url, {
      headers: { authorization: 'Bearer secret-token-123' }
    })
    assert.equal(resAuthorized.status, 200)
    const jsonAuthorized = (await resAuthorized.json()) as { ok: boolean; service: string }
    assert.equal(jsonAuthorized.ok, true)
    assert.equal(jsonAuthorized.service, 'BOT_404')
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
