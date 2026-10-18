import test from 'node:test'
import assert from 'node:assert/strict'
import type http from 'node:http'
import { safeCompare, authorized } from '../src/dashboard.js'

test('safeCompare performs constant-time string comparison', () => {
  assert.equal(safeCompare('secret123', 'secret123'), true)
  assert.equal(safeCompare('secret123', 'secret124'), false)
  assert.equal(safeCompare('short', 'longer_string'), false)
  assert.equal(safeCompare('', ''), true)
})

test('authorized rejects requests without or with invalid bearer headers when DASHBOARD_TOKEN is set', () => {
  const origToken = process.env.DASHBOARD_TOKEN
  try {
    process.env.DASHBOARD_TOKEN = 'secret-token-123'
    const mockReqNoAuth = { headers: {} } as unknown as http.IncomingMessage
    const mockReqWrongAuth = { headers: { authorization: 'Bearer wrongtoken' } } as unknown as http.IncomingMessage
    const mockReqValidAuth = { headers: { authorization: 'Bearer secret-token-123' } } as unknown as http.IncomingMessage

    assert.equal(authorized(mockReqNoAuth), false)
    assert.equal(authorized(mockReqWrongAuth), false)
    assert.equal(authorized(mockReqValidAuth), true)
  } finally {
    process.env.DASHBOARD_TOKEN = origToken
  }
})
