import fs from 'fs'
import path from 'path'
import {
  parseElfaProductWorkbook,
  draftsToRosverImportJson,
} from '../src/lib/elfa-excel-import.ts'

const p = 'C:/Users/wilso/Downloads/PRODUCTO ELFA COD ACTUALIZACION.xlsx'
const buf = fs.readFileSync(p)
const r = parseElfaProductWorkbook(buf, 'PRODUCTO ELFA COD ACTUALIZACION.xlsx')
console.log('stats', r.stats)
console.log('first', JSON.stringify(r.products[0], null, 2))
console.log(
  'film',
  JSON.stringify(
    r.products.find((x) => x.sku === 'FILT20-1K'),
    null,
    2,
  ),
)

const json = draftsToRosverImportJson(r.products)
const outDir = path.resolve('server/data/import-templates')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(
  path.join(outDir, 'products-import.v1.example.json'),
  JSON.stringify(
    {
      version: 1,
      format: 'rosver-products-import',
      brandName: 'ELFA',
      products: json.products.slice(0, 2),
    },
    null,
    2,
  ),
)
fs.writeFileSync(
  path.join(outDir, 'products-elfa-from-xlsx.json'),
  JSON.stringify(json, null, 2),
)
console.log('wrote', json.products.length, 'to', outDir)
