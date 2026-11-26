import type { RowDataPacket } from 'mysql2/promise'
import { MAX_QUOTA } from '#shared/types/festival'
import { getDbPool } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'

interface CompetitionPatchBody {
  fee?: number
  maxQuota?: number
}

function formatRp(value: number): string {
  return `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<CompetitionPatchBody>(event)

  if (!id) return { ok: false, message: 'Lomba tidak ditemukan.' }

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, name, fee, max_quota FROM competitions WHERE id = ? LIMIT 1', [id])
    const comp = rows[0]
    if (!comp) return { ok: false, message: 'Lomba tidak ditemukan.' }

    const nextFee = body?.fee !== undefined ? Math.max(0, Math.min(1_000_000, Math.round(Number(body.fee)))) : Number(comp.fee)
    const nextQuota = body?.maxQuota !== undefined ? Math.max(1, Math.min(MAX_QUOTA, Math.round(Number(body.maxQuota)))) : Number(comp.max_quota)

    await pool.execute('UPDATE competitions SET fee = ?, max_quota = ? WHERE id = ?', [nextFee, nextQuota, id])
    return {
      ok: true,
      message: `${String(comp.name)} diperbarui: kuota ${nextQuota} peserta, biaya ${formatRp(nextFee)}.`,
      fee: nextFee,
      maxQuota: nextQuota,
    }
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const comp = fb.competitions.find(c => c.id === id)
    if (!comp) return { ok: false, message: 'Lomba tidak ditemukan.' }
    if (body?.fee !== undefined) comp.fee = Math.max(0, Math.min(1_000_000, Math.round(Number(body.fee))))
    if (body?.maxQuota !== undefined) comp.maxQuota = Math.max(1, Math.min(MAX_QUOTA, Math.round(Number(body.maxQuota)))) as typeof MAX_QUOTA
    writeFallbackDb(fb)
    return {
      ok: true,
      message: `${comp.name} diperbarui: kuota ${comp.maxQuota} peserta, biaya ${formatRp(comp.fee)}.`,
      fee: comp.fee,
      maxQuota: comp.maxQuota,
    }
  }
})
