import test from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { startDashboard } from '../src/dashboard.js'

test('dashboard authentication enforces DASHBOARD_TOKEN and timing-safe checks', async () => {
  const dummyRepo = {} as any
  delete process.env.DASHBOARD_TOKEN

  const server = startDashboard(dummyRepo)
  await new Promise(resolve => server.once('listening', resolve))
  const address = server.address() as AddressInfo
  const baseUrl = `http://127.0.0.1:${address.port}`

  try {
    // 1. Unset DASHBOARD_TOKEN -> Should return 401
    const res1 = await fetch(`${baseUrl}/api/status`)
    assert.equal(res1.status, 401)

    // 2. Set DASHBOARD_TOKEN and test invalid token -> Should return 401
    process.env.DASHBOARD_TOKEN = 'secret-token-123'
    const res2 = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer wrong-token' }
    })
    assert.equal(res2.status, 401)

    // 3. Valid token -> Should return 200
    const res3 = await fetch(`${baseUrl}/api/status`, {
      headers: { authorization: 'Bearer secret-token-123' }
    })
    assert.equal(res3.status, 200)
    const data = await res3.json()
    assert.equal(data.ok, true)
  } finally {
    delete process.env.DASHBOARD_TOKEN
    await new Promise(resolve => server.close(resolve))
  }
})
