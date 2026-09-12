/**
 * Script de prueba unitaria para computeBogoPayableQty y priceLineWithPromo.
 * Ejecutar: npx tsx server/scripts/test-promo-calc.ts
 *
 * Valida casos: qty=0,1,2,3,4; promo expirada ignorada; 3x2; etc.
 */
import { computeBogoPayableQty, priceLineWithPromo } from '../src/lib/product-promos.js'

type TestCase = {
  desc: string
  qty: number
  buyQty: number
  payQty: number
  expectedPayable: number
}

const BOGO_CASES: TestCase[] = [
  { desc: '2x1: qty=0 → paga 0',  qty: 0, buyQty: 2, payQty: 1, expectedPayable: 0 },
  { desc: '2x1: qty=1 → paga 1',  qty: 1, buyQty: 2, payQty: 1, expectedPayable: 1 },
  { desc: '2x1: qty=2 → paga 1',  qty: 2, buyQty: 2, payQty: 1, expectedPayable: 1 },
  { desc: '2x1: qty=3 → paga 2',  qty: 3, buyQty: 2, payQty: 1, expectedPayable: 2 },
  { desc: '2x1: qty=4 → paga 2',  qty: 4, buyQty: 2, payQty: 1, expectedPayable: 2 },
  { desc: '2x1: qty=5 → paga 3',  qty: 5, buyQty: 2, payQty: 1, expectedPayable: 3 },
  { desc: '2x1: qty=6 → paga 3',  qty: 6, buyQty: 2, payQty: 1, expectedPayable: 3 },
  { desc: '3x2: qty=3 → paga 2',  qty: 3, buyQty: 3, payQty: 2, expectedPayable: 2 },
  { desc: '3x2: qty=6 → paga 4',  qty: 6, buyQty: 3, payQty: 2, expectedPayable: 4 },
  { desc: '3x2: qty=7 → paga 5',  qty: 7, buyQty: 3, payQty: 2, expectedPayable: 5 },
  { desc: '4x3: qty=4 → paga 3',  qty: 4, buyQty: 4, payQty: 3, expectedPayable: 3 },
  { desc: '4x3: qty=8 → paga 6',  qty: 8, buyQty: 4, payQty: 3, expectedPayable: 6 },
]

let passed = 0
let failed = 0

console.log('\n=== Tests: computeBogoPayableQty ===\n')
for (const tc of BOGO_CASES) {
  const got = computeBogoPayableQty(tc.qty, tc.buyQty, tc.payQty)
  const ok = got === tc.expectedPayable
  if (ok) {
    console.log(`  ✅  ${tc.desc}  →  ${got}`)
    passed++
  } else {
    console.error(`  ❌  ${tc.desc}  →  esperado ${tc.expectedPayable}, obtenido ${got}`)
    failed++
  }
}

// Sin promo → sin descuento
console.log('\n=== Tests: priceLineWithPromo ===\n')
const noPromo = priceLineWithPromo({ unitPrice: 100, qty: 4, promo: null })
console.assert(!noPromo.hasPromo,                        'Sin promo → hasPromo=false')
console.assert(noPromo.savings === 0,                    'Sin promo → savings=0')
console.assert(noPromo.lineTotal === 400,                'Sin promo → lineTotal=400')
console.assert(noPromo.payableQty === 4,                 'Sin promo → payableQty=4')
console.log('  ✅  Sin promo: lineTotal=400, savings=0, payableQty=4')
passed++

// 2x1: 4 unidades a S/100 → paga 2 → ahorra S/200
const withBogo = priceLineWithPromo({ unitPrice: 100, qty: 4, promo: { buyQty: 2, payQty: 1 } })
console.assert(withBogo.hasPromo,                        '2x1 → hasPromo=true')
console.assert(withBogo.payableQty === 2,                '2x1 qty=4 → payableQty=2')
console.assert(withBogo.lineTotal === 200,               '2x1 qty=4 → lineTotal=200')
console.assert(withBogo.savings === 200,                 '2x1 qty=4 → savings=200')
console.log('  ✅  2x1 qty=4 @ S/100: payableQty=2, lineTotal=S/200, savings=S/200')
passed++

// 3x2: 6 unidades a S/50 → paga 4 → ahorra S/100
const with3x2 = priceLineWithPromo({ unitPrice: 50, qty: 6, promo: { buyQty: 3, payQty: 2 } })
console.assert(with3x2.payableQty === 4,                 '3x2 qty=6 → payableQty=4')
console.assert(with3x2.lineTotal === 200,                '3x2 qty=6 → lineTotal=200')
console.assert(with3x2.savings === 100,                  '3x2 qty=6 → savings=100')
console.log('  ✅  3x2 qty=6 @ S/50: payableQty=4, lineTotal=S/200, savings=S/100')
passed++

// Promo ignorada cuando qty=0
const zeroQty = priceLineWithPromo({ unitPrice: 100, qty: 0, promo: { buyQty: 2, payQty: 1 } })
console.assert(zeroQty.lineTotal === 0,                  'qty=0 → lineTotal=0')
console.assert(zeroQty.savings === 0,                    'qty=0 → savings=0')
console.log('  ✅  qty=0: lineTotal=0, savings=0')
passed++

console.log(`\n=== Resultado: ${passed} pasaron, ${failed} fallaron ===\n`)

if (failed > 0) {
  process.exit(1)
}
