import { getDbPool, getTiDBConfig } from '../utils/db'

export default defineEventHandler(async () => {
  const config = getTiDBConfig()
  try {
    const pool = getDbPool()
    await pool.query('SELECT 1 AS ok')
    return {
      status: 'ok',
      app: 'Menangin!',
      edition: 2026,
      database: {
        provider: 'TiDB Cloud',
        host: config.host,
        name: config.database,
        connected: true,
      },
      message: 'Festival service is ready and connected to TiDB Cloud.',
    }
  } catch (error) {
    return {
      status: 'degraded',
      app: 'Menangin!',
      edition: 2026,
      database: {
        provider: 'TiDB Cloud',
        host: config.host,
        name: config.database,
        connected: false,
        error: error instanceof Error ? error.message : 'Database connection failed',
      },
      message: 'Festival service running, but TiDB Cloud connection failed.',
    }
  }
})
