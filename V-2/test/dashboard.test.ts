import test from 'node:test'
import assert from 'node:assert/strict'
import type http from 'node:http'
import { authorized } from '../src/dashboard.js'

test('dashboard authorization checks authorization header securely', () => {
  const mockReq = (authHeader?: string) => ({
    headers: authHeader ? { authorization: authHeader } : {}
  } as unknown as http.IncomingMessage)

  // When DASHBOARD_TOKEN is empty in non-production, missing token falls back to NODE_ENV
  assert.equal(authorized(mockReq()), process.env.NODE_ENV !== 'production')

  // When authorization header matches expected format
  if (process.env.DASHBOARD_TOKEN) {
    const validHeader = `Bearer ${process.env.DASHBOARD_TOKEN}`
    assert.equal(authorized(mockReq(validHeader)), true)
    assert.equal(authorized(mockReq('Bearer wrong_token')), false)
    assert.equal(authorized(mockReq('InvalidScheme token')), false)
  }
})
