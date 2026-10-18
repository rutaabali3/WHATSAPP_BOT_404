import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

function httpRequest(url: string, options: http.RequestOptions, body?: string | Buffer) {
  return new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
    const req = http.request(url, options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, data }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

const mockRepo: any = {
  pool: {
    execute: async () => [[]]
  }
}

test('dashboard security: rejects unauthenticated requests when token is empty or invalid', async () => {
  const originalToken = process.env.DASHBOARD_TOKEN
  const originalPort = process.env.DASHBOARD_PORT
  process.env.DASHBOARD_TOKEN = ''
  process.env.DASHBOARD_PORT = '8799'

  const server = startDashboard(mockRepo)

  try {
    const resUnauth = await httpRequest('http://127.0.0.1:8799/api/status', { method: 'GET' })
    assert.equal(resUnauth.statusCode, 401)

    process.env.DASHBOARD_TOKEN = 'secret-token-123'
    const resWrongToken = await httpRequest('http://127.0.0.1:8799/api/status', {
      method: 'GET',
      headers: { authorization: 'Bearer wrong-token' }
    })
    assert.equal(resWrongToken.statusCode, 401)

    const resValid = await httpRequest('http://127.0.0.1:8799/api/status', {
      method: 'GET',
      headers: { authorization: 'Bearer secret-token-123' }
    })
    assert.equal(resValid.statusCode, 200)
    const json = JSON.parse(resValid.data)
    assert.equal(json.ok, true)
  } finally {
    server.close()
    process.env.DASHBOARD_TOKEN = originalToken
    process.env.DASHBOARD_PORT = originalPort
  }
})

test('dashboard security: rejects oversized payloads on POST /api/trusted', async () => {
  const originalToken = process.env.DASHBOARD_TOKEN
  const originalPort = process.env.DASHBOARD_PORT
  process.env.DASHBOARD_TOKEN = 'secret-token-123'
  process.env.DASHBOARD_PORT = '8798'

  const server = startDashboard(mockRepo)

  try {
    // Send payload > 64 KB
    const largeBody = JSON.stringify({ jid: 'a'.repeat(70000), type: 'user' })
    const resLarge = await httpRequest('http://127.0.0.1:8798/api/trusted', {
      method: 'POST',
      headers: {
        authorization: 'Bearer secret-token-123',
        'content-type': 'application/json'
      }
    }, largeBody)

    assert.equal(resLarge.statusCode, 413)
    const json = JSON.parse(resLarge.data)
    assert.equal(json.error, 'payload_too_large')
  } finally {
    server.close()
    process.env.DASHBOARD_TOKEN = originalToken
    process.env.DASHBOARD_PORT = originalPort
  }
})
