import { getDbPool } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'
import { getSessionCookie } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = getSessionCookie(event)
  if (session.role !== 'panitia') {
    return { ok: false, message: 'Hanya panitia yang dapat mengubah status klaim sertifikat.' }
  }

  const body = await readBody<{ enabled?: boolean }>(event)
  const enabled = Boolean(body?.enabled)

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    await pool.execute(
      `INSERT INTO festival_settings (setting_key, setting_value)
       VALUES ('certificate_claim_enabled', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [enabled ? 'true' : 'false'],
    )
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    fb.settings = { certificateClaimEnabled: enabled }
    writeFallbackDb(fb)
  }

  return {
    ok: true,
    certificateClaimEnabled: enabled,
    message: enabled
      ? 'Klaim sertifikat DIAKTIFKAN. Peserta dan pemenang kini dapat melihat & mengunduh sertifikat.'
      : 'Klaim sertifikat DINONAKTIFKAN. Pratinjau dan unduhan sertifikat terkunci di halaman peserta.',
  }
})
