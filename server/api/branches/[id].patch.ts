import type { RowDataPacket } from 'mysql2/promise'
import { getDbPool } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'

interface BranchPatchBody {
  date?: string
  startTime?: string
  endTime?: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<BranchPatchBody>(event)
  const date = String(body?.date || '').trim()
  const startTime = String(body?.startTime || '').trim()
  const endTime = String(body?.endTime || '').trim()

  if (!id || !date || !startTime || !endTime) {
    return { ok: false, message: 'Data jadwal tidak lengkap.' }
  }
  if (startTime >= endTime) {
    return { ok: false, message: 'Jam mulai harus lebih awal dari jam selesai.' }
  }

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    const [existingRows] = await pool.execute<RowDataPacket[]>('SELECT id, name FROM branches WHERE id = ? LIMIT 1', [id])
    const branch = existingRows[0]
    if (!branch) return { ok: false, message: 'Cabang tidak ditemukan.' }

    const [conflictRows] = await pool.execute<RowDataPacket[]>('SELECT id FROM branches WHERE date = ? AND id <> ? LIMIT 1', [date, id])
    if (conflictRows.length > 0) {
      return { ok: false, message: 'Tanggal ini sudah dipakai cabang lain. Setiap cabang harus berbeda hari.' }
    }

    await pool.execute('UPDATE branches SET date = ?, start_time = ?, end_time = ? WHERE id = ?', [date, startTime, endTime, id])
    return { ok: true, message: `Jadwal ${String(branch.name)} diperbarui. Divisi Putra/Putri otomatis mengikuti hari cabang.` }
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const branch = fb.branches.find(b => b.id === id)
    if (!branch) return { ok: false, message: 'Cabang tidak ditemukan.' }
    if (fb.branches.some(other => other.id !== id && other.date === date)) {
      return { ok: false, message: 'Tanggal ini sudah dipakai cabang lain. Setiap cabang harus berbeda hari.' }
    }
    branch.date = date
    branch.startTime = startTime
    branch.endTime = endTime
    writeFallbackDb(fb)
    return { ok: true, message: `Jadwal ${branch.name} diperbarui. Divisi Putra/Putri otomatis mengikuti hari cabang.` }
  }
})
