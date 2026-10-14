import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

test('dashboard authorization checks', async () => {
  process.env.DASHBOARD_TOKEN = 'secret-token-123'
  const mockRepo = { pool: { execute: async () => [] } } as any
  const server = startDashboard(mockRepo)

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  const baseUrl = `http://127.0.0.1:${address.port}`

  try {
    // Test without auth header -> 401
    const res1 = await fetch(`${baseUrl}/api/status`)
    assert.equal(res1.status, 401)

    // Test with invalid token -> 401
    const res2 = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer wrong-token' }
    })
    assert.equal(res2.status, 401)

    // Test with valid token -> 200
    const res3 = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer secret-token-123' }
    })
    assert.equal(res3.status, 200)
    const body = await res3.json()
    assert.equal(body.ok, true)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
