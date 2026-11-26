import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mysql, { type Pool, type PoolConnection, type PoolOptions } from 'mysql2/promise'

export interface TiDBConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  ssl: boolean
  caPath: string
}

let cachedPool: Pool | null = null
let cachedConfigKey = ''

function readDotEnvOverrides(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return {}
  try {
    const out: Record<string, string> = {}
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      out[key] = val
    }
    return out
  } catch {
    return {}
  }
}

export function getTiDBConfig(): TiDBConfig {
  let runtime: Record<string, unknown> | null = null
  try {
    runtime = useRuntimeConfig() as unknown as Record<string, unknown>
  } catch {
    runtime = null
  }
  const fileEnv = readDotEnvOverrides()

  const host = String(fileEnv.TIDB_HOST || process.env.TIDB_HOST || runtime?.tidbHost || '')
  const port = Number(fileEnv.TIDB_PORT || process.env.TIDB_PORT || runtime?.tidbPort || 4000)
  const user = String(fileEnv.TIDB_USER || process.env.TIDB_USER || runtime?.tidbUser || '')
  const password = String(fileEnv.TIDB_PASSWORD || process.env.TIDB_PASSWORD || runtime?.tidbPassword || '')
  const database = String(fileEnv.TIDB_DATABASE || process.env.TIDB_DATABASE || runtime?.tidbDatabase || 'menangin')
  const sslRaw = fileEnv.TIDB_SSL ?? process.env.TIDB_SSL
  const ssl = sslRaw !== undefined
    ? sslRaw !== 'false'
    : runtime?.tidbSsl !== undefined
      ? Boolean(runtime.tidbSsl)
      : true
  const caPath = String(fileEnv.TIDB_CA_PATH || process.env.TIDB_CA_PATH || runtime?.tidbCaPath || '')

  return { host, port, user, password, database, ssl, caPath }
}

export function buildPoolOptions(config: TiDBConfig, includeDatabase = true): PoolOptions {
  if (!config.host || !config.user) {
    throw new Error('TiDB Cloud belum dikonfigurasi. Pastikan TIDB_HOST, TIDB_USER, dan TIDB_PASSWORD terisi di .env.')
  }

  const options: PoolOptions = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4',
  }

  if (includeDatabase && config.database) {
    options.database = config.database
  }

  if (config.ssl) {
    options.ssl = config.caPath
      ? { minVersion: 'TLSv1.2', rejectUnauthorized: true, ca: readFileSync(config.caPath, 'utf8') }
      : { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  }

  return options
}

export function getDbPool(): Pool {
  const config = getTiDBConfig()
  const key = `${config.host}:${config.port}:${config.user}:${config.password}:${config.database}:${config.ssl}:${config.caPath}`
  if (!cachedPool || cachedConfigKey !== key) {
    if (cachedPool) {
      void cachedPool.end().catch(() => {})
    }
    cachedPool = mysql.createPool(buildPoolOptions(config, true))
    cachedConfigKey = key
  }
  return cachedPool
}

export function resetDbPool(): void {
  if (cachedPool) {
    void cachedPool.end().catch(() => {})
    cachedPool = null
    cachedConfigKey = ''
  }
}

export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getDbPool().getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}
