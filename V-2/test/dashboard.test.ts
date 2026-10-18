import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'
import type { MessageRepository } from '../src/db.js'

test('dashboard authentication and security constraints', async (t) => {
  process.env.DASHBOARD_TOKEN = 'secret-token-123'
  process.env.DASHBOARD_PORT = '8799'

  const dummyRepo = {
    pool: {
      execute: async () => [[]],
    },
  } as unknown as MessageRepository

  const server = startDashboard(dummyRepo)

  t.after(() => {
    server.close()
  })

  // 1. Unauthorized request
  const unauthRes = await new Promise<{ statusCode?: number }>((resolve, reject) => {
    const req = http.request('http://127.0.0.1:8799/api/status', { method: 'GET' }, (res) => {
      resolve({ statusCode: res.statusCode })
    })
    req.on('error', reject)
    req.end()
  })
  assert.equal(unauthRes.statusCode, 401)

  // 2. Authorized request with matching Bearer token
  const authRes = await new Promise<{ statusCode?: number }>((resolve, reject) => {
    const req = http.request('http://127.0.0.1:8799/api/status', {
      method: 'GET',
      headers: { Authorization: 'Bearer secret-token-123' },
    }, (res) => {
      resolve({ statusCode: res.statusCode })
    })
    req.on('error', reject)
    req.end()
  })
  assert.equal(authRes.statusCode, 200)

  // 3. Payload size exceeding 1MB
  const payloadRes = await new Promise<{ statusCode?: number }>((resolve, reject) => {
    const req = http.request('http://127.0.0.1:8799/api/trusted', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret-token-123',
        'Content-Type': 'application/json',
      },
    }, (res) => {
      resolve({ statusCode: res.statusCode })
    })
    req.on('error', reject)

    // Write > 1MB of data
    const chunk = Buffer.alloc(512 * 1024, 'a')
    req.write(chunk)
    req.write(chunk)
    req.write(chunk)
    req.end()
  })
  assert.equal(payloadRes.statusCode, 413)
})
