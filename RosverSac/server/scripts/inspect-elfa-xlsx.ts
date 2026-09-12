import XLSX from 'xlsx'
import fs from 'fs'

const paths = [
  'C:/Users/wilso/Downloads/PRODUCTO ELFA COD ACTUALIZACION.xlsx',
  'C:/Users/wilso/Downloads/PRODUCTO ELFA COD ACTUALIZACION - copia (1).xlsx',
]

for (const p of paths) {
  if (!fs.existsSync(p)) {
    console.log('MISSING', p)
    continue
  }
  const wb = XLSX.readFile(p, { cellDates: false, raw: false })
  console.log('\n====', p.split('/').pop(), 'sheets', wb.SheetNames)
  for (const name of wb.SheetNames) {
    const sh = wb.Sheets[name]
    const rows = XLSX.utils.sheet_to_json(sh, {
      header: 1,
      defval: null,
      raw: false,
    }) as unknown[][]
    console.log('---', name, 'rows', rows.length)
    for (let i = 0; i < Math.min(22, rows.length); i++) {
      console.log(String(i).padStart(2), JSON.stringify(rows[i]))
    }
    console.log('... stretch zone')
    for (let i = 18; i < Math.min(40, rows.length); i++) {
      console.log(String(i).padStart(2), JSON.stringify(rows[i]))
    }
  }
}
