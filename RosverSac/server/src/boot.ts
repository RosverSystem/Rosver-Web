/**
 * Boot producción: migrate → seed (upsert) → servidor web+api.
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const sacRoot = path.resolve(here, '../..')

// ── Commit SHA ──────────────────────────────────────────────────────────────
// Railway inyecta RAILWAY_GIT_COMMIT_SHA en prod; como fallback leemos el
// archivo .deploy-commit que escriben los scripts de deploy.
function resolveCommitSha(): string | null {
  const fromEnv =
    process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    null
  if (fromEnv) return fromEnv
  try {
    const file = path.join(sacRoot, '.deploy-commit')
    return readFileSync(file, 'utf8').trim() || null
  } catch {
    return null
  }
}

const commitSha = resolveCommitSha()
if (commitSha) {
  console.log(`[boot] commitSha=${commitSha}`)
} else {
  console.log('[boot] commitSha=unknown (set RAILWAY_GIT_COMMIT_SHA or run deploy script)')
}

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
await run(path.join(here, 'seed-ubigeo.ts'))
await import('./index.ts')
