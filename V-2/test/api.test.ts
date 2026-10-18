import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidHttpUrl } from '../src/api.js'

test('isValidHttpUrl accepts public http and https URLs', () => {
  assert.equal(isValidHttpUrl('https://example.com/a?q=1'), true)
  assert.equal(isValidHttpUrl('http://google.com'), true)
  assert.equal(isValidHttpUrl('https://sub.domain.org/path'), true)
})

test('isValidHttpUrl rejects invalid schemes and non-URLs', () => {
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false)
  assert.equal(isValidHttpUrl('file:///etc/passwd'), false)
  assert.equal(isValidHttpUrl('ftp://example.com'), false)
  assert.equal(isValidHttpUrl('not-a-url'), false)
})

test('isValidHttpUrl rejects private/internal hostnames and IPs (SSRF protection)', () => {
  assert.equal(isValidHttpUrl('http://localhost:3000'), false)
  assert.equal(isValidHttpUrl('http://127.0.0.1:8080'), false)
  assert.equal(isValidHttpUrl('http://127.0.0.1'), false)
  assert.equal(isValidHttpUrl('http://0.0.0.0'), false)
  assert.equal(isValidHttpUrl('http://10.0.0.1'), false)
  assert.equal(isValidHttpUrl('http://172.16.0.1'), false)
  assert.equal(isValidHttpUrl('http://192.168.1.1'), false)
  assert.equal(isValidHttpUrl('http://[::1]'), false)
})
