import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

function makeRequest(port: number, headers: Record<string, string> = {}): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://127.0.0.1:${port}/api/status`, { method: 'GET', headers }, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body }))
    })
    req.on('error', reject)
    req.end()
  })
}

test('dashboard authorization security checks', async (t) => {
  const origToken = process.env.DASHBOARD_TOKEN
  const port = 8799
  process.env.DASHBOARD_PORT = String(port)
  const mockRepo = {} as any
  const server = startDashboard(mockRepo)

  t.after(() => {
    server.close()
    if (origToken !== undefined) process.env.DASHBOARD_TOKEN = origToken
    else delete process.env.DASHBOARD_TOKEN
  })

  // Test 1: When DASHBOARD_TOKEN is empty, requests are rejected with 401
  delete process.env.DASHBOARD_TOKEN
  const res1 = await makeRequest(port)
  assert.equal(res1.statusCode, 401)

  // Test 2: When DASHBOARD_TOKEN is set, invalid Bearer token rejected with 401
  process.env.DASHBOARD_TOKEN = 'secret-token-123'
  const res2 = await makeRequest(port, { authorization: 'Bearer wrong-token' })
  assert.equal(res2.statusCode, 401)

  // Test 3: When DASHBOARD_TOKEN is set, missing Bearer token rejected with 401
  const res3 = await makeRequest(port)
  assert.equal(res3.statusCode, 401)

  // Test 4: Valid Bearer token accepted with 200
  const res4 = await makeRequest(port, { authorization: 'Bearer secret-token-123' })
  assert.equal(res4.statusCode, 200)
  assert.match(res4.body, /"ok":true/)
})
