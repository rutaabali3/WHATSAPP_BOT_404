import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

test('dashboard rejects oversized payloads with HTTP 413', async () => {
  const mockRepo = {
    pool: {
      execute: async () => [[]]
    }
  } as any

  const server = startDashboard(mockRepo)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }

  try {
    const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path: '/api/trusted',
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          }
        },
        res => {
          let body = ''
          res.on('data', chunk => (body += chunk))
          res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body }))
        }
      )
      req.on('error', reject)
      const largeData = 'x'.repeat(70 * 1024)
      req.write(JSON.stringify({ jid: '123@s.whatsapp.net', type: 'user', extra: largeData }))
      req.end()
    })

    assert.equal(response.statusCode, 413)
    const json = JSON.parse(response.body)
    assert.equal(json.error, 'payload_too_large')
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})

test('dashboard validates jid and type parameters with HTTP 400', async () => {
  const mockRepo = {
    pool: {
      execute: async () => [[]]
    }
  } as any

  const server = startDashboard(mockRepo)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }

  try {
    const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path: '/api/trusted',
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          }
        },
        res => {
          let body = ''
          res.on('data', chunk => (body += chunk))
          res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body }))
        }
      )
      req.on('error', reject)
      req.write(JSON.stringify({ jid: '123@s.whatsapp.net', type: 'invalid_type' }))
      req.end()
    })

    assert.equal(response.statusCode, 400)
    const json = JSON.parse(response.body)
    assert.equal(json.error, 'invalid jid or type')
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})
