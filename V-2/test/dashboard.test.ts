import test from 'node:test'
import assert from 'node:assert/strict'
import type http from 'node:http'
import { authorized } from '../src/dashboard.js'

test('dashboard timing-safe authorized check', () => {
  const reqValid = { headers: { authorization: 'Bearer mysecrettoken123' } } as unknown as http.IncomingMessage
  const reqInvalid = { headers: { authorization: 'Bearer wrongsecrettoken' } } as unknown as http.IncomingMessage
  const reqShort = { headers: { authorization: 'Bearer short' } } as unknown as http.IncomingMessage
  const reqMissing = { headers: {} } as unknown as http.IncomingMessage

  assert.equal(authorized(reqValid, 'mysecrettoken123'), true)
  assert.equal(authorized(reqInvalid, 'mysecrettoken123'), false)
  assert.equal(authorized(reqShort, 'mysecrettoken123'), false)
  assert.equal(authorized(reqMissing, 'mysecrettoken123'), false)
})
