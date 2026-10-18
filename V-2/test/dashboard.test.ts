import test from 'node:test'
import assert from 'node:assert/strict'
import type http from 'node:http'
import { authorized } from '../src/dashboard.js'

test('denies authorization when DASHBOARD_TOKEN is not set or empty', () => {
  const originalToken = process.env.DASHBOARD_TOKEN
  delete process.env.DASHBOARD_TOKEN
  try {
    const req = { headers: { authorization: 'Bearer secret' } } as unknown as http.IncomingMessage
    assert.equal(authorized(req), false)
  } finally {
    process.env.DASHBOARD_TOKEN = originalToken
  }
})

test('denies authorization for missing or invalid authorization header', () => {
  const originalToken = process.env.DASHBOARD_TOKEN
  process.env.DASHBOARD_TOKEN = 'secret123'
  try {
    const noHeaderReq = { headers: {} } as unknown as http.IncomingMessage
    assert.equal(authorized(noHeaderReq), false)

    const wrongHeaderReq = { headers: { authorization: 'Bearer wrongsecret' } } as unknown as http.IncomingMessage
    assert.equal(authorized(wrongHeaderReq), false)

    const malformedReq = { headers: { authorization: 'Basic secret123' } } as unknown as http.IncomingMessage
    assert.equal(authorized(malformedReq), false)
  } finally {
    process.env.DASHBOARD_TOKEN = originalToken
  }
})

test('grants authorization for valid Bearer token', () => {
  const originalToken = process.env.DASHBOARD_TOKEN
  process.env.DASHBOARD_TOKEN = 'secret123'
  try {
    const validReq = { headers: { authorization: 'Bearer secret123' } } as unknown as http.IncomingMessage
    assert.equal(authorized(validReq), true)
  } finally {
    process.env.DASHBOARD_TOKEN = originalToken
  }
})
