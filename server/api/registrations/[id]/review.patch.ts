import type { ResultSetHeader } from 'mysql2/promise'
import type { PaymentStatus } from '#shared/types/festival'
import { getDbPool } from '../../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../../utils/fallback-store'
import { ensureDatabaseReady } from '../../../utils/schema'

const VALID_STATUSES: PaymentStatus[] = [
  'Belum Bayar',
  'Menunggu Verifikasi',
  'Terverifikasi',
  'Lunas',
  'Perlu Diperbaiki',
  'Ditolak',
]

interface ReviewBody {
  status?: PaymentStatus
  note?: string
}

export default defineEventHandler(async (event) => {
  const registrationId = getRouterParam(event, 'id')
  const body = await readBody<ReviewBody>(event)
  const status = body?.status
  const note = String(body?.note || '').trim()

  if (!registrationId || !status || !VALID_STATUSES.includes(status)) {
    return { ok: false, message: 'Data verifikasi tidak valid.' }
  }

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE registrations SET payment_status = ?, review_note = ? WHERE id = ?',
      [status, note, registrationId],
    )
    if (result.affectedRows === 0) return { ok: false, message: 'Pendaftaran tidak ditemukan.' }
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const reg = fb.registrations.find(r => r.id === registrationId)
    if (!reg) return { ok: false, message: 'Pendaftaran tidak ditemukan.' }
    reg.paymentStatus = status
    reg.reviewNote = note
    writeFallbackDb(fb)
  }

  return { ok: true, message: `Status pembayaran diperbarui menjadi ${status}.`, status, note }
})
