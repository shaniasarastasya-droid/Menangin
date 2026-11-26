import type { ResultSetHeader } from 'mysql2/promise'
import { withTransaction } from '../../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../../utils/fallback-store'
import { ensureDatabaseReady } from '../../../utils/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    return { ok: false, message: 'ID pendaftaran tidak valid.' }
  }

  try {
    await ensureDatabaseReady()
    return await withTransaction(async (conn) => {
      await conn.execute('DELETE FROM winners WHERE registration_id = ?', [id])
      const [res] = await conn.execute<ResultSetHeader>('DELETE FROM registrations WHERE id = ?', [id])
      if (res.affectedRows === 0) {
        return { ok: false, message: 'Pendaftaran tidak ditemukan.' }
      }
      return { ok: true, message: 'Pendaftaran peserta dihapus dan kuota dikembalikan.' }
    })
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const before = fb.registrations.length
    fb.registrations = fb.registrations.filter(r => r.id !== id)
    if (fb.registrations.length === before) {
      return { ok: false, message: 'Pendaftaran tidak ditemukan.' }
    }
    fb.winners = fb.winners.filter(w => w.registrationId !== id)
    writeFallbackDb(fb)
    return { ok: true, message: 'Pendaftaran peserta dihapus dan kuota dikembalikan.' }
  }
})
