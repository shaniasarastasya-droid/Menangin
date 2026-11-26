import type { ParticipantProfile } from '#shared/types/festival'
import { getDbPool } from '../../utils/db'
import { isDbConnectionError, readFallbackDb, writeFallbackDb } from '../../utils/fallback-store'
import { ensureDatabaseReady } from '../../utils/schema'

type UpdateProfileBody = Omit<ParticipantProfile, 'id'>

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<Partial<UpdateProfileBody>>(event)

  if (!id) {
    return { ok: false, message: 'ID peserta tidak valid.' }
  }

  const namaLengkap = String(body?.namaLengkap || '').trim()
  const asalSekolah = String(body?.asalSekolah || '').trim()
  const noWhatsapp = String(body?.noWhatsapp || '').trim()
  const email = body?.email !== undefined ? String(body.email).trim().toLowerCase() : undefined
  const jenisKelamin = body?.jenisKelamin === 'Putra' ? 'Putra' : 'Putri'
  const kategori = body?.kategori === 'Mahasiswa' || body?.kategori === 'Umum' ? body.kategori : 'Siswa'

  if (!namaLengkap || !asalSekolah || !noWhatsapp) {
    return { ok: false, message: 'Lengkapi semua field data diri.' }
  }

  const updated: ParticipantProfile = {
    id,
    namaLengkap,
    asalSekolah,
    noWhatsapp,
    ...(email !== undefined ? { email } : {}),
    jenisKelamin,
    kategori,
  }

  try {
    await ensureDatabaseReady()
    const pool = getDbPool()
    if (email !== undefined) {
      await pool.execute(
        `UPDATE participants
         SET nama_lengkap = ?, asal_sekolah = ?, no_whatsapp = ?, email = ?, jenis_kelamin = ?, kategori = ?
         WHERE id = ?`,
        [namaLengkap, asalSekolah, noWhatsapp, email, jenisKelamin, kategori, id],
      )
    } else {
      await pool.execute(
        `UPDATE participants
         SET nama_lengkap = ?, asal_sekolah = ?, no_whatsapp = ?, jenis_kelamin = ?, kategori = ?
         WHERE id = ?`,
        [namaLengkap, asalSekolah, noWhatsapp, jenisKelamin, kategori, id],
      )
    }
    await pool.execute(`UPDATE users SET display_name = ? WHERE participant_id = ?`, [namaLengkap, id])
  } catch (error) {
    if (!isDbConnectionError(error)) throw error
    const fb = readFallbackDb()
    const target = fb.participants.find(p => p.id === id)
    if (target) Object.assign(target, updated)
    const user = fb.users.find(u => u.participantId === id)
    if (user) user.displayName = namaLengkap
    writeFallbackDb(fb)
  }

  return { ok: true, message: 'Data diri berhasil disimpan.', participant: updated }
})
