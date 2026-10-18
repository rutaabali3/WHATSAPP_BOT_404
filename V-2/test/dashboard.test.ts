import test from 'node:test'
import assert from 'node:assert/strict'
import type http from 'node:http'
import { authorized } from '../src/dashboard.js'

test('authorized rejects missing or malformed authorization header when token set', () => {
  process.env.DASHBOARD_TOKEN = 'secret_token_123'
  try {
    const reqNoHeader = { headers: {} } as http.IncomingMessage
    assert.equal(authorized(reqNoHeader), false)

    const reqWrongToken = { headers: { authorization: 'Bearer wrong_token' } } as http.IncomingMessage
    assert.equal(authorized(reqWrongToken), false)

    const reqWrongPrefix = { headers: { authorization: 'Basic dXNlcjpwYXNz' } } as http.IncomingMessage
    assert.equal(authorized(reqWrongPrefix), false)

    const reqValidToken = { headers: { authorization: 'Bearer secret_token_123' } } as http.IncomingMessage
    assert.equal(authorized(reqValidToken), true)
  } finally {
    delete process.env.DASHBOARD_TOKEN
  }
})
