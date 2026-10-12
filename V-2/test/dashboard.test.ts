import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

test('dashboard authentication tests', async (t) => {
  const origToken = process.env.DASHBOARD_TOKEN
  const origNodeEnv = process.env.NODE_ENV

  const dummyRepo: any = {
    pool: {
      execute: async () => [[]]
    }
  }

  const server = startDashboard(dummyRepo)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  const baseUrl = `http://127.0.0.1:${address.port}`

  t.after(() => {
    process.env.DASHBOARD_TOKEN = origToken
    process.env.NODE_ENV = origNodeEnv
    server.close()
  })

  await t.test('rejects request when DASHBOARD_TOKEN is unset or empty', async () => {
    delete process.env.DASHBOARD_TOKEN
    process.env.NODE_ENV = 'development'
    const res = await fetch(`${baseUrl}/api/status`)
    assert.equal(res.status, 401)
    const body = await res.json()
    assert.deepEqual(body, { error: 'unauthorized' })
  })

  await t.test('rejects request with invalid token', async () => {
    process.env.DASHBOARD_TOKEN = 'secret-token-123'
    const res = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer wrong-token' }
    })
    assert.equal(res.status, 401)
  })

  await t.test('accepts request with valid token', async () => {
    process.env.DASHBOARD_TOKEN = 'secret-token-123'
    const res = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer secret-token-123' }
    })
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.ok, true)
  })
})
