import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

function isLocalDatabaseUrl(url: string) {
  return (
    /@(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url) ||
    url.includes('sslmode=disable')
  )
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: isLocalDatabaseUrl(config.databaseUrl)
    ? false
    : { rejectUnauthorized: false },
})

export type DbClient = pg.PoolClient

export async function withClient<T>(fn: (c: DbClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}
