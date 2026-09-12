#!/usr/bin/env node
/**
 * Test unitario para el helper assertGoogleOAuthState.
 * Corre sin credenciales de Google ni base de datos.
 *
 * Uso:  node server/scripts/test-oauth-state.mjs
 *   o:  npm run test:oauth-state   (desde RosverSac/)
 */
import assert from 'node:assert/strict'

// Inline copy de la lógica (TS puro → no necesita tsx en este test)
function assertGoogleOAuthState(cookieValue, queryState) {
  if (!cookieValue) return { ok: false, reason: 'missing_cookie' }
  if (!queryState) return { ok: false, reason: 'missing_state' }
  if (cookieValue !== queryState) return { ok: false, reason: 'mismatch' }
  return { ok: true }
}

let passed = 0

function test(description, fn) {
  try {
    fn()
    console.log(`  ✓ ${description}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${description}`)
    console.error(`    ${err.message}`)
    process.exitCode = 1
  }
}

console.log('assertGoogleOAuthState')

test('estado igual → ok', () => {
  assert.deepEqual(assertGoogleOAuthState('abc-123', 'abc-123'), { ok: true })
})

test('sin cookie → missing_cookie', () => {
  assert.deepEqual(assertGoogleOAuthState(undefined, 'abc'), {
    ok: false,
    reason: 'missing_cookie',
  })
})

test('cookie vacía → missing_cookie', () => {
  assert.deepEqual(assertGoogleOAuthState('', 'abc'), {
    ok: false,
    reason: 'missing_cookie',
  })
})

test('sin state en query → missing_state', () => {
  assert.deepEqual(assertGoogleOAuthState('abc', undefined), {
    ok: false,
    reason: 'missing_state',
  })
})

test('state no coincide → mismatch', () => {
  assert.deepEqual(assertGoogleOAuthState('abc', 'xyz'), {
    ok: false,
    reason: 'mismatch',
  })
})

test('UUID válido → ok', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000'
  assert.deepEqual(assertGoogleOAuthState(uuid, uuid), { ok: true })
})

test('UUID diferente → mismatch', () => {
  const a = '550e8400-e29b-41d4-a716-446655440000'
  const b = '660f9511-f3ac-52e5-b827-557766551111'
  assert.deepEqual(assertGoogleOAuthState(a, b), { ok: false, reason: 'mismatch' })
})

console.log(`\n${passed} tests pasados${process.exitCode ? ' (con fallos)' : ''}`)
