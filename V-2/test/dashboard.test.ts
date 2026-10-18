import test from 'node:test'
import assert from 'node:assert/strict'

test('dashboard authorization tests', async (t) => {
  process.env.DASHBOARD_TOKEN = 'secret-token-123'
  // Import dashboard dynamically after setting DASHBOARD_TOKEN env var
  const { startDashboard } = await import('../src/dashboard.js')
  const mockRepo = { pool: { execute: async () => [[]] } } as any
  const server = startDashboard(mockRepo)

  await new Promise<void>((resolve) => {
    if (server.listening) resolve()
    else server.once('listening', resolve)
  })

  const address = server.address() as { port: number }
  const baseUrl = `http://127.0.0.1:${address.port}`

  await t.test('rejects request without authorization header', async () => {
    const res = await fetch(`${baseUrl}/api/status`)
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.deepEqual(body, { error: 'unauthorized' })
  })

  await t.test('rejects request with invalid bearer token', async () => {
    const res = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer invalid-token' }
    })
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.deepEqual(body, { error: 'unauthorized' })
  })

  await t.test('accepts request with valid bearer token', async () => {
    const res = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer secret-token-123' }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.ok, true)
  })

  server.close()
})
