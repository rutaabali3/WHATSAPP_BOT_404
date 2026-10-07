import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { authorized, startDashboard } from '../src/dashboard.js'

test('authorized uses timing-safe token matching', () => {
  const reqValid = { headers: { authorization: 'Bearer secret123' } } as http.IncomingMessage
  const reqInvalid = { headers: { authorization: 'Bearer wrongtoken' } } as http.IncomingMessage
  const reqNoAuth = { headers: {} } as http.IncomingMessage

  assert.equal(authorized(reqValid, 'secret123'), true)
  assert.equal(authorized(reqInvalid, 'secret123'), false)
  assert.equal(authorized(reqNoAuth, 'secret123'), false)
})

test('startDashboard enforces payload size limit on POST /api/trusted', async () => {
  const mockRepo: any = {
    pool: {
      execute: async () => [[]]
    }
  }

  const server = startDashboard(mockRepo)

  if (!server.listening) {
    await new Promise(resolve => server.once('listening', resolve))
  }

  const port = (server.address() as AddressInfo).port

  try {
    const hugeData = 'a'.repeat(70 * 1024)
    const status = await new Promise<number>((resolve, reject) => {
      const req = http.request(`http://127.0.0.1:${port}/api/trusted`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        }
      }, (res) => {
        resolve(res.statusCode ?? 0)
      })
      req.on('error', reject)
      req.write(hugeData)
      req.end()
    })

    assert.equal(status, 413)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})
