import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

function request(url: string, options: http.RequestOptions, body?: string): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        let data: any = raw
        try { data = JSON.parse(raw) } catch {}
        resolve({ statusCode: res.statusCode ?? 500, data })
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

test('dashboard authentication requires valid bearer token', async () => {
  process.env.DASHBOARD_TOKEN = 'testsecret123'
  process.env.DASHBOARD_PORT = '9876'

  const mockRepo: any = {
    pool: {
      execute: async () => []
    }
  }

  const server = startDashboard(mockRepo)

  try {
    const unauthRes = await request('http://127.0.0.1:9876/api/status', { method: 'GET' })
    assert.equal(unauthRes.statusCode, 401)
    assert.deepEqual(unauthRes.data, { error: 'unauthorized' })

    const badTokenRes = await request('http://127.0.0.1:9876/api/status', {
      method: 'GET',
      headers: { authorization: 'Bearer wrongtoken' }
    })
    assert.equal(badTokenRes.statusCode, 401)

    const authRes = await request('http://127.0.0.1:9876/api/status', {
      method: 'GET',
      headers: { authorization: 'Bearer testsecret123' }
    })
    assert.equal(authRes.statusCode, 200)
    assert.equal(authRes.data.ok, true)
  } finally {
    server.close()
  }
})

test('dashboard rejects invalid entity type in /api/trusted', async () => {
  process.env.DASHBOARD_TOKEN = 'testsecret123'
  process.env.DASHBOARD_PORT = '9877'

  const mockRepo: any = {
    pool: {
      execute: async () => []
    }
  }

  const server = startDashboard(mockRepo)

  try {
    const invalidTypeRes = await request('http://127.0.0.1:9877/api/trusted', {
      method: 'POST',
      headers: {
        authorization: 'Bearer testsecret123',
        'content-type': 'application/json'
      }
    }, JSON.stringify({ jid: '123@s.whatsapp.net', type: 'admin' }))

    assert.equal(invalidTypeRes.statusCode, 400)
    assert.deepEqual(invalidTypeRes.data, { error: 'invalid entity type' })

    const validRes = await request('http://127.0.0.1:9877/api/trusted', {
      method: 'POST',
      headers: {
        authorization: 'Bearer testsecret123',
        'content-type': 'application/json'
      }
    }, JSON.stringify({ jid: '123@s.whatsapp.net', type: 'user' }))

    assert.equal(validRes.statusCode, 201)
    assert.deepEqual(validRes.data, { ok: true })
  } finally {
    server.close()
  }
})
