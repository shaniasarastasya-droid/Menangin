import { getDbPool } from '../../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../../utils/fallback-store'
import { ensureDatabaseReady } from '../../../utils/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) return { ok: false }

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id])
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const item = fb.notifications.find(n => n.id === id)
    if (item) {
      item.read = true
      writeFallbackDb(fb)
    }
  }
  return { ok: true }
})
