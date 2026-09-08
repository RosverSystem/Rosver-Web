/**
 * Boot producción: migrate → seed (upsert) → servidor web+api.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

function run(script: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', script], {
      stdio: 'inherit',
      cwd: path.resolve(here, '../..'),
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} exit ${code}`))
    })
  })
}

await run(path.join(here, 'migrate.ts'))
await run(path.join(here, 'seed.ts'))
await import('./index.ts')
