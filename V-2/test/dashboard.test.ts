import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { startDashboard } from '../src/dashboard.js'

test('dashboard authentication handles valid, invalid, and missing tokens', async () => {
  process.env.DASHBOARD_TOKEN = 'test-secret-token'

  const mockRepo = {
    pool: { execute: async () => [[]] }
  } as any

  const server = startDashboard(mockRepo)

  await new Promise<void>((resolve) => {
    if (server.listening) resolve()
    else server.once('listening', resolve)
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 8788
  const baseUrl = `http://127.0.0.1:${port}`

  const makeRequest = (headers: Record<string, string>) =>
    new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
      const req = http.request(`${baseUrl}/api/status`, { headers }, (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body: JSON.parse(data || '{}') }))
      })
      req.on('error', reject)
      req.end()
    })

  try {
    const resMissing = await makeRequest({})
    assert.equal(resMissing.statusCode, 401)

    const resWrong = await makeRequest({ authorization: 'Bearer wrong-token' })
    assert.equal(resWrong.statusCode, 401)

    const resValid = await makeRequest({ authorization: 'Bearer test-secret-token' })
    assert.equal(resValid.statusCode, 200)
    assert.equal(resValid.body.ok, true)
  } finally {
    server.close()
  }
})
