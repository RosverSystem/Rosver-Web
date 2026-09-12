/**
 * Tests puros (sin DB / sin credenciales Google).
 * Run: npx tsx server/scripts/test-pricing-security.ts
 */
import {
  assertGoogleOAuthState,
  computeBogoPayableQty,
  priceLineWithBogo,
  sanitizeReviewBody,
  sanitizeReviewTitle,
} from '../src/lib/pricing-security.ts'

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed++
  } else {
    console.log('OK:', msg)
  }
}

// OAuth state
assert(assertGoogleOAuthState('abc', 'abc').ok === true, 'state match')
assert(assertGoogleOAuthState('abc', 'xyz').ok === false, 'state mismatch')
assert(assertGoogleOAuthState(null, 'abc').ok === false, 'state missing')

// Sanitize XSS
assert(
  sanitizeReviewTitle('<script>alert(1)</script>Hola').includes('script') ===
    false,
  'title strips tags',
)
assert(sanitizeReviewTitle('a'.repeat(200)).length === 120, 'title max 120')
assert(
  sanitizeReviewBody('<img onerror=alert(1)>ok').includes('<') === false,
  'body strips tags',
)
assert(sanitizeReviewBody('').length === 0, 'empty body ok')

// BOGO 2x1 (buy 2 pay 1)
assert(computeBogoPayableQty(1, 2, 1) === 1, '2x1 qty=1 → pay 1')
assert(computeBogoPayableQty(2, 2, 1) === 1, '2x1 qty=2 → pay 1')
assert(computeBogoPayableQty(3, 2, 1) === 2, '2x1 qty=3 → pay 2')
assert(computeBogoPayableQty(4, 2, 1) === 2, '2x1 qty=4 → pay 2')
assert(computeBogoPayableQty(0, 2, 1) === 0, '2x1 qty=0 → pay 0')

const p = priceLineWithBogo({ unitPrice: 10, qty: 2, buyQty: 2, payQty: 1 })
assert(p.payableQty === 1 && p.lineTotal === 10 && p.savings === 10, 'price 2x1')

if (failed) {
  console.error(`\n${failed} failed`)
  process.exit(1)
}
console.log('\nAll pricing-security tests passed.')
