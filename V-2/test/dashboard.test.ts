import test from 'node:test'
import assert from 'node:assert/strict'
import type http from 'node:http'
import { authorized } from '../src/dashboard.js'

test('dashboard authorization with token comparison', () => {
  const secretToken = 'secret-123-token'

  const mockReqValid = {
    headers: { authorization: 'Bearer secret-123-token' }
  } as http.IncomingMessage

  const mockReqInvalidToken = {
    headers: { authorization: 'Bearer wrong-token' }
  } as http.IncomingMessage

  const mockReqMissingHeader = {
    headers: {}
  } as http.IncomingMessage

  assert.equal(authorized(mockReqValid, secretToken), true)
  assert.equal(authorized(mockReqInvalidToken, secretToken), false)
  assert.equal(authorized(mockReqMissingHeader, secretToken), false)
})

test('dashboard authorization behavior when no token is set', () => {
  const mockReq = { headers: {} } as http.IncomingMessage
  const envOriginal = process.env.NODE_ENV

  process.env.NODE_ENV = 'production'
  assert.equal(authorized(mockReq, ''), false)

  process.env.NODE_ENV = 'development'
  assert.equal(authorized(mockReq, ''), true)

  process.env.NODE_ENV = envOriginal
})
