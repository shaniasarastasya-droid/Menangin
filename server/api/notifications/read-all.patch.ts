import { getDbPool } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ participantId?: string }>(event)
  const participantId = String(body?.participantId || '').trim()

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    if (participantId) {
      await pool.execute(`UPDATE notifications SET is_read = 1 WHERE participant_id = ? OR participant_id = 'all'`, [participantId])
    } else {
      await pool.execute(`UPDATE notifications SET is_read = 1 WHERE participant_id = 'all'`)
    }
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    for (const n of fb.notifications) {
      if (n.participantId === 'all' || (participantId && n.participantId === participantId)) {
        n.read = true
      }
    }
    writeFallbackDb(fb)
  }

  return { ok: true, message: 'Semua notifikasi ditandai dibaca.' }
})
